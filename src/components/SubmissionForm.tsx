import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Save, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { Entity } from '../types';

interface SubmissionFormProps {
  entities: Entity[];
  questions: string[];
  onUpdate: (entities: Entity[]) => void;
}

export const SubmissionForm: React.FC<SubmissionFormProps> = ({ entities, questions, onUpdate }) => {
  const [localEntities, setLocalEntities] = useState<Entity[]>(entities);

  const handleChange = (id: string, field: keyof Entity, value: string) => {
    const updated = localEntities.map(e => e.id === id ? { ...e, [field]: value } : e);
    setLocalEntities(updated);
  };

  const handleAdd = () => {
    const newEntity: Entity = {
      id: Math.random().toString(36).substr(2, 9),
      key: 'New Key',
      value: 'New Value',
      description: 'New Description'
    };
    setLocalEntities([...localEntities, newEntity]);
  };

  const handleRemove = (id: string) => {
    setLocalEntities(localEntities.filter(e => e.id !== id));
  };

  const handleSave = () => {
    onUpdate(localEntities);
  };

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localEntities, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "510k_dataset.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <Card className="w-full h-full flex flex-col border-none shadow-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            510(k) Submission Dataset Editor
          </CardTitle>
          <CardDescription>
            Review and refine the extracted entities for your submission.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" /> Add Entity
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" /> Download JSON
          </Button>
          <Button size="sm" onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Save className="w-4 h-4 mr-2" /> Save Changes
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-[600px] pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localEntities.map((entity) => (
              <Card key={entity.id} className="p-4 border border-gray-200 dark:border-gray-800 bg-white/30 dark:bg-gray-800/30 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 mr-4">
                    <Label className="text-xs font-mono text-gray-500 mb-1 block">KEY</Label>
                    <Input 
                      value={entity.key} 
                      onChange={(e) => handleChange(entity.id, 'key', e.target.value)}
                      className="font-bold text-sm"
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(entity.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mb-4">
                  <Label className="text-xs font-mono text-gray-500 mb-1 block">VALUE</Label>
                  <Input 
                    value={entity.value} 
                    onChange={(e) => handleChange(entity.id, 'value', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs font-mono text-gray-500 mb-1 block">DESCRIPTION</Label>
                  <Input 
                    value={entity.description} 
                    onChange={(e) => handleChange(entity.id, 'description', e.target.value)}
                    className="text-xs italic"
                  />
                </div>
              </Card>
            ))}
          </div>

          {questions.length > 0 && (
            <div className="mt-12 space-y-6">
              <Separator />
              <div className="space-y-2">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  20 Comprehensive Follow-up Questions
                </h3>
                <p className="text-sm text-gray-500">Critical questions identified by the AI agent for further review.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {questions.map((q, i) => (
                  <div key={i} className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/30 dark:bg-gray-800/30 text-sm">
                    <span className="font-bold text-blue-500 mr-2">Q{i+1}.</span>
                    {q}
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
