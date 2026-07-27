"use client";

import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface IssuesPageProps {
  issues: any[];
}

export default function IssuesPage({ issues }: IssuesPageProps) {
  const mappedIssues = issues.map((i: any) => ({
    type: i.type || 'Issue',
    building: i.location || i.building_id || 'N/A',
    priority: i.severity || 'Medium',
    time: new Date(i.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
  }));

  return (
    <div className="space-y-3">
      {mappedIssues.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-500">
            No issues reported. All operations running smoothly!
          </p>
        </div>
      ) : (
        mappedIssues.map((issue: any, idx: number) => (
          <div key={idx} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  issue.priority === 'Critical' || issue.priority === 'Urgent' ? 'bg-red-100' : 'bg-orange-100'
                }`}>
                  <AlertTriangle className={`w-5 h-5 ${
                    issue.priority === 'Critical' || issue.priority === 'Urgent' ? 'text-red-600' : 'text-orange-600'
                  }`} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase">{issue.type}</h3>
                  <p className="text-xs font-bold text-gray-500 uppercase">{issue.building} • {issue.time}</p>
                </div>
              </div>
              <span className={`text-xs font-black px-2 py-1 rounded-full uppercase ${
                issue.priority === 'Critical' || issue.priority === 'Urgent' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {issue.priority}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}