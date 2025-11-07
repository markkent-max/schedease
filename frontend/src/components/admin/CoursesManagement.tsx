import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Search } from 'lucide-react';
import { apiService } from '../services/api';
import { toast } from 'sonner';

interface SubjectItem {
  _id?: string;
  subjectCode: string;
  description: string;
  units?: number;
  schoolYear?: string;
  semester?: string;
  instructorName?: string;
  day?: string;
  time?: string;
  yearLevel?: '1' | '2' | '3' | '4';
}

export function CoursesManagement() {
  const [subjectsByYear, setSubjectsByYear] = useState<Record<'1'|'2'|'3'|'4', SubjectItem[]>>({ '1': [], '2': [], '3': [], '4': [] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [importState, setImportState] = useState<{ open: boolean; year?: '1'|'2'|'3'|'4'; file: File | null; importing: boolean; result: any | null }>({ open: false, year: undefined, file: null, importing: false, result: null });

  useEffect(() => {
    loadAllYears();
  }, []);

  const loadAllYears = async () => {
    try {
      setLoading(true);
      const [y1, y2, y3, y4] = await Promise.all([
        apiService.getSubjects({ yearLevel: '1' }),
        apiService.getSubjects({ yearLevel: '2' }),
        apiService.getSubjects({ yearLevel: '3' }),
        apiService.getSubjects({ yearLevel: '4' })
      ]);
      const mapRes = (r: any): SubjectItem[] => (r?.subjects || r?.data || r || []).map((s: any) => ({
        _id: s._id,
        subjectCode: s.subjectCode,
        description: s.description || s.name || '',
        units: s.units,
        schoolYear: s.schoolYear,
        semester: s.semester,
        instructorName: s.instructorName,
        day: s.day || s.dayOfWeek,
        time: s.time || (s.startTime && s.endTime ? `${s.startTime}-${s.endTime}` : undefined),
        yearLevel: s.yearLevel
      }));
      setSubjectsByYear({ '1': mapRes(y1), '2': mapRes(y2), '3': mapRes(y3), '4': mapRes(y4) });
    } catch (error) {
      console.error('Failed to load subjects:', error);
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };
  const reloadYear = async (year: '1'|'2'|'3'|'4') => {
    try {
      const res = await apiService.getSubjects({ yearLevel: year });
      const list: SubjectItem[] = (res?.subjects || res?.data || res || []).map((s: any) => ({
        _id: s._id,
        subjectCode: s.subjectCode,
        description: s.description || s.name || '',
        units: s.units,
        schoolYear: s.schoolYear,
        semester: s.semester,
        instructorName: s.instructorName,
        day: s.day,
        time: s.time,
        yearLevel: s.yearLevel
      }));
      setSubjectsByYear(prev => ({ ...prev, [year]: list }));
    } catch (e) {
      console.error('Failed to reload year', year, e);
    }
  };

  const yearMeta: Record<'1'|'2'|'3'|'4', { title: string; color: string }> = {
    '1': { title: 'First Year', color: 'text-blue-700' },
    '2': { title: 'Second Year', color: 'text-green-700' },
    '3': { title: 'Third Year', color: 'text-purple-700' },
    '4': { title: 'Fourth Year', color: 'text-amber-700' }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(['1','2','3','4'] as const).map((year) => (
        <Card key={year}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className={yearMeta[year].color}>{yearMeta[year].title} Subjects</CardTitle>
              <CardDescription>Subjects assigned to {yearMeta[year].title.toLowerCase()}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-56">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search subjects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setImportState({ open: true, year, file: null, importing: false, result: null })}
              >
                Import {yearMeta[year].title}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Schedule</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjectsByYear[year]
                    .filter(s =>
                      !searchTerm ||
                      s.subjectCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.instructorName?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((s) => (
                    <TableRow key={s._id || s.subjectCode}>
                      <TableCell className="font-medium">{s.subjectCode}</TableCell>
                      <TableCell>{s.description}</TableCell>
                      <TableCell>{s.units ?? '-'}</TableCell>
                      <TableCell>{s.semester || '-'}</TableCell>
                      <TableCell>{s.instructorName || '-'}</TableCell>
                      <TableCell>{s.day && s.time ? `${s.day} • ${s.time}` : '-'}</TableCell>
                    </TableRow>
                  ))}
                  {subjectsByYear[year].length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No subjects found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Year-specific Import Dialog */}
      <Dialog open={importState.open} onOpenChange={(open) => setImportState(prev => ({ ...prev, open }))}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Import {importState.year ? yearMeta[importState.year].title : ''} Subjects</DialogTitle>
            <DialogDescription>Upload an Excel file (.xlsx/.xls) to import subjects for this year level.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subjects-year-file">Excel File</Label>
              <Input
                id="subjects-year-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setImportState(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setImportState(prev => ({ ...prev, open: false }))}>Cancel</Button>
              <Button
                className="bg-gray-900 hover:bg-gray-800 text-white"
                disabled={!importState.file || !importState.year || importState.importing}
                onClick={async () => {
                  if (!importState.file || !importState.year) return;
                  setImportState(prev => ({ ...prev, importing: true, result: null }));
                  try {
                    const res = await apiService.importSubjects(importState.file, { yearLevel: importState.year });
                    setImportState(prev => ({ ...prev, result: res }));
                    toast.success('Import completed');
                    await reloadYear(importState.year);
                  } catch (err: any) {
                    toast.error(err?.message || 'Import failed');
                  } finally {
                    setImportState(prev => ({ ...prev, importing: false }));
                  }
                }}
              >
                {importState.importing ? 'Importing…' : 'Upload & Import'}
              </Button>
            </div>
            {importState.result && (
              <div className="text-sm text-gray-700 border-t pt-3">
                <div>Inserted: {importState.result.inserted ?? importState.result.insertedCount ?? 0}</div>
                <div>Duplicates: {importState.result.duplicates ?? importState.result.duplicateCount ?? 0}</div>
                {importState.result.schedulesCreated !== undefined && (
                  <div>Schedules Created: {importState.result.schedulesCreated}</div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}