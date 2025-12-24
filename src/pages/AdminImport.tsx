import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { importClausesFromJson, getClauseCount } from '@/services/SupabaseService';
import clausesData from '@/data/tieban-clauses.json';

/**
 * Admin page for importing clauses data
 * Access this at /admin-import
 */
export default function AdminImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    imported?: number;
    total?: number;
    errors?: string[];
  } | null>(null);
  const [clauseCount, setClauseCount] = useState<number | null>(null);

  const { toast } = useToast();

  const handleCheckCount = async () => {
    const count = await getClauseCount();
    setClauseCount(count);
  };

  const handleImport = async () => {
    setIsImporting(true);
    setResult(null);

    try {
      toast({
        title: '开始导入',
        description: `正在处理 ${clausesData.length} 条记录...`,
      });

      const importResult = await importClausesFromJson(clausesData);
      
      setResult({
        success: importResult.success,
        imported: importResult.imported,
        total: clausesData.length,
        errors: importResult.errors,
      });

      if (importResult.success) {
        toast({
          title: '导入完成',
          description: `成功导入 ${importResult.imported} 条记录`,
        });
      } else {
        toast({
          title: '导入失败',
          description: importResult.errors?.[0] || '未知错误',
          variant: 'destructive',
        });
      }

      // Refresh count
      await handleCheckCount();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: '导入出错',
        description: String(error),
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-2xl mx-auto px-4">
        <div className="bg-card border border-border rounded-lg p-8 space-y-8">
          {/* Header */}
          <div className="text-center border-b border-border pb-6">
            <h1 className="text-3xl font-display text-primary">条文数据导入</h1>
            <p className="text-muted-foreground mt-2">
              铁板神数条文库管理工具
            </p>
          </div>

          {/* JSON Info */}
          <div className="bg-secondary/50 rounded p-4">
            <h2 className="text-lg font-medium mb-2">数据文件信息</h2>
            <p className="text-muted-foreground">
              文件: tieban-clauses.json
            </p>
            <p className="text-muted-foreground">
              条文数量: <span className="text-foreground">{clausesData.length}</span> 条
            </p>
          </div>

          {/* Database Info */}
          <div className="bg-secondary/50 rounded p-4">
            <h2 className="text-lg font-medium mb-2">数据库状态</h2>
            <div className="flex items-center gap-4">
              <p className="text-muted-foreground">
                已有记录: 
                <span className="text-foreground ml-2">
                  {clauseCount !== null ? clauseCount : '未检查'}
                </span>
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCheckCount}
              >
                刷新
              </Button>
            </div>
          </div>

          {/* Import Button */}
          <div className="space-y-4">
            <Button
              onClick={handleImport}
              disabled={isImporting}
              className="w-full py-6 text-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isImporting ? (
                <span className="animate-pulse">导入中...</span>
              ) : (
                '开始导入条文'
              )}
            </Button>
            <p className="text-muted-foreground text-sm text-center">
              重复的条文编号将被更新，不会产生重复记录
            </p>
          </div>

          {/* Result */}
          {result && (
            <div className={`rounded p-4 ${result.success ? 'bg-jade/20' : 'bg-destructive/20'}`}>
              <h3 className={`font-medium ${result.success ? 'text-jade' : 'text-destructive'}`}>
                {result.success ? '导入成功' : '导入失败'}
              </h3>
              {result.imported !== undefined && (
                <p className="text-foreground/80 mt-1">
                  成功导入: {result.imported} / {result.total} 条
                </p>
              )}
              {result.errors && result.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-muted-foreground text-sm">错误信息:</p>
                  <ul className="text-destructive text-sm mt-1">
                    {result.errors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Back Link */}
          <div className="text-center pt-4 border-t border-border">
            <a href="/" className="text-primary hover:underline">
              返回主页
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
