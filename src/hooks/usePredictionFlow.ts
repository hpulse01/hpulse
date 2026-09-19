import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/hooks/useI18n';
import { useHPulsePipeline } from '@/hpulse/react';
import { getClauseCount } from '@/services/SupabaseService';
import { savePredictionRun } from '@/services/predictionLedger';
import type { BirthDataWithGeo } from '@/components/BirthDataForm';
import type {
  KaoKeWithMatch,
  CalibrationResult,
  FullDestinyReport,
} from '@/utils/tiebanAlgorithm';
import type { QuantumPredictionResult } from '@/utils/quantumPredictionEngine';
import type { FullPredictionReport } from '@/types/unifiedPrediction';

export type AppStep = 'input' | 'calculating' | 'verification' | 'projecting' | 'result';

export type UnifiedReport = FullPredictionReport;

/**
 * State machine + orchestration for the prediction console:
 * input → calculating → verification (Kao Ke) → projecting → result.
 *
 * The verification step is optional: users may skip 六亲校时 via
 * handleSkipVerification, which proceeds with systemOffset=0 and sets
 * verificationSkipped=true so downstream UX can disclose that the
 * source-validation step was bypassed.
 */
export function usePredictionFlow() {
  const [step, setStep] = useState<AppStep>('input');
  const [birthInput, setBirthInput] = useState<BirthDataWithGeo | null>(null);
  const [rawBirthForm, setRawBirthForm] = useState<BirthDataWithGeo | null>(null);
  const [ganZhiDisplay, setGanZhiDisplay] = useState('');
  const [baseNumber, setBaseNumber] = useState(0);
  const [theoreticalBase, setTheoreticalBase] = useState(0);
  const [fullReport, setFullReport] = useState<FullDestinyReport | null>(null);
  const [calibrationResult, setCalibrationResult] = useState<CalibrationResult | null>(null);
  const [quantumResult, setQuantumResult] = useState<QuantumPredictionResult | null>(null);
  const [clauseCount, setClauseCount] = useState<number | null>(null);
  const [unifiedReport, setUnifiedReport] = useState<UnifiedReport | null>(null);
  const [selectedKaoKe, setSelectedKaoKe] = useState<KaoKeWithMatch | null>(null);
  const [verificationSkipped, setVerificationSkipped] = useState(false);

  const { toast } = useToast();
  const { t } = useI18n();
  const hpulse = useHPulsePipeline();

  useEffect(() => {
    getClauseCount()
      .then(count => setClauseCount(count))
      .catch(() => setClauseCount(0));
  }, []);

  const handleBirthDataSubmit = useCallback(async (birthData: BirthDataWithGeo) => {
    setStep('calculating');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const { TiebanEngine } = await import('@/utils/tiebanAlgorithm');
      setBirthInput(birthData);
      setRawBirthForm(birthData);
      const result = TiebanEngine.calculateBaseNumber(birthData);
      setBaseNumber(result.baseNumber);
      setGanZhiDisplay(result.pillars.fullDisplay);
      const theoreticBase = TiebanEngine.calculateTheoreticalBase(birthData);
      setTheoreticalBase(theoreticBase);
      setStep('verification');
    } catch (error) {
      console.error('Calculation error:', error);
      toast({ title: t('ui.calc_error'), description: t('ui.calc_error_desc'), variant: 'destructive' });
      setStep('input');
    }
  }, [toast, t]);

  const handleTimeLocked = useCallback(async (
    lockedKeIndex: number,
    selectedOption: KaoKeWithMatch
  ) => {
    setStep('projecting');
    setSelectedKaoKe(selectedOption);
    setVerificationSkipped(false);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const [{ TiebanEngine }, { QuantumPredictionEngine }, { PredictionOrchestrator }] = await Promise.all([
        import('@/utils/tiebanAlgorithm'),
        import('@/utils/quantumPredictionEngine'),
        import('@/utils/predictionOrchestrator'),
      ]);
      const systemOffset = TiebanEngine.calculateSystemOffset(theoreticalBase, selectedOption.clauseNumber);
      const calibration: CalibrationResult = {
        theoreticalBase,
        confirmedClauseId: selectedOption.clauseNumber,
        systemOffset,
        lockedQuarterIndex: lockedKeIndex
      };
      setCalibrationResult(calibration);
      const report: FullDestinyReport = TiebanEngine.generateFullDestinyReport(birthInput!, theoreticalBase, systemOffset);
      setFullReport(report);
      // Single query timestamp shared by both pipelines — keeps legacy quantum
      // result and HPU pipeline deterministic relative to the same instant.
      const queryTimeUtc = new Date().toISOString();
      const qResult = QuantumPredictionEngine.predict({ ...birthInput!, queryTimeUtc }, systemOffset);
      setQuantumResult(qResult);
      if (qResult.unifiedResult) {
        setUnifiedReport(PredictionOrchestrator.fromResult(qResult.unifiedResult.input, qResult));
        // P6: archive run into the verification ledger (no-op when logged out
        // or audit-blocked); failures never interrupt the prediction flow.
        void savePredictionRun(qResult.unifiedResult).catch(() => {});
      }

      // HPU-2..9 pipeline (deterministic, parallel to legacy result).
      if (rawBirthForm) {
        const pad = (n: number) => String(n).padStart(2, '0');
        const raw = {
          birth_date: `${rawBirthForm.year}-${pad(rawBirthForm.month)}-${pad(rawBirthForm.day)}`,
          birth_time: `${pad(rawBirthForm.hour)}:${pad(rawBirthForm.minute)}`,
          calendar: 'gregorian' as const,
          calculation_name: rawBirthForm.calculationName,
          location_name: rawBirthForm.normalizedLocationName,
          latitude: rawBirthForm.geoLatitude,
          longitude: rawBirthForm.geoLongitude,
          timezone: rawBirthForm.timezoneIana,
          timezone_offset_minutes: rawBirthForm.timezoneOffsetMinutes,
          gender: rawBirthForm.gender,
          query_time_utc: queryTimeUtc,
          query_type: 'natal' as const,
          granularity: 'year' as const,
        };
        void hpulse.run(raw, { event: 'general', granularity: 'year' });
      }

      setStep('result');
      toast({ title: t('ui.prediction_complete'), description: t('ui.prediction_complete_desc') });
    } catch (error) {
      console.error('Projection error:', error);
      toast({ title: t('ui.proj_error'), description: t('ui.proj_error_desc'), variant: 'destructive' });
      setStep('verification');
    }
  }, [theoreticalBase, birthInput, rawBirthForm, hpulse, toast, t]);

  const handleSkipVerification = useCallback(async () => {
    setStep('projecting');
    setVerificationSkipped(true);
    setSelectedKaoKe(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const [{ TiebanEngine }, { QuantumPredictionEngine }, { PredictionOrchestrator }] = await Promise.all([
        import('@/utils/tiebanAlgorithm'),
        import('@/utils/quantumPredictionEngine'),
        import('@/utils/predictionOrchestrator'),
      ]);
      const systemOffset = 0;
      const calibration: CalibrationResult = {
        theoreticalBase,
        confirmedClauseId: 0,
        systemOffset,
        lockedQuarterIndex: -1,
      };
      setCalibrationResult(calibration);
      const report: FullDestinyReport = TiebanEngine.generateFullDestinyReport(birthInput!, theoreticalBase, systemOffset);
      setFullReport(report);
      const queryTimeUtc = new Date().toISOString();
      const qResult = QuantumPredictionEngine.predict({ ...birthInput!, queryTimeUtc }, systemOffset);
      setQuantumResult(qResult);
      if (qResult.unifiedResult) {
        setUnifiedReport(PredictionOrchestrator.fromResult(qResult.unifiedResult.input, qResult));
        void savePredictionRun(qResult.unifiedResult).catch(() => {});
      }

      if (rawBirthForm) {
        const pad = (n: number) => String(n).padStart(2, '0');
        const raw = {
          birth_date: `${rawBirthForm.year}-${pad(rawBirthForm.month)}-${pad(rawBirthForm.day)}`,
          birth_time: `${pad(rawBirthForm.hour)}:${pad(rawBirthForm.minute)}`,
          calendar: 'gregorian' as const,
          calculation_name: rawBirthForm.calculationName,
          location_name: rawBirthForm.normalizedLocationName,
          latitude: rawBirthForm.geoLatitude,
          longitude: rawBirthForm.geoLongitude,
          timezone: rawBirthForm.timezoneIana,
          timezone_offset_minutes: rawBirthForm.timezoneOffsetMinutes,
          gender: rawBirthForm.gender,
          query_time_utc: queryTimeUtc,
          query_type: 'natal' as const,
          granularity: 'year' as const,
        };
        void hpulse.run(raw, { event: 'general', granularity: 'year' });
      }

      setStep('result');
      toast({ title: t('ui.prediction_complete'), description: t('ui.prediction_complete_desc') });
    } catch (error) {
      console.error('Projection error (skip verification):', error);
      toast({ title: t('ui.proj_error'), description: t('ui.proj_error_desc'), variant: 'destructive' });
      setStep('verification');
    }
  }, [theoreticalBase, birthInput, rawBirthForm, hpulse, toast, t]);

  const handleReset = useCallback(() => {
    setStep('input');
    setBirthInput(null);
    setRawBirthForm(null);
    setGanZhiDisplay('');
    setBaseNumber(0);
    setTheoreticalBase(0);
    setFullReport(null);
    setCalibrationResult(null);
    setQuantumResult(null);
    setUnifiedReport(null);
    setSelectedKaoKe(null);
    setVerificationSkipped(false);
    hpulse.reset();
  }, [hpulse]);

  return {
    step,
    birthInput,
    ganZhiDisplay,
    baseNumber,
    theoreticalBase,
    fullReport,
    calibrationResult,
    quantumResult,
    clauseCount,
    unifiedReport,
    selectedKaoKe,
    verificationSkipped,
    hpulse,
    handleBirthDataSubmit,
    handleTimeLocked,
    handleSkipVerification,
    handleReset,
  };
}
