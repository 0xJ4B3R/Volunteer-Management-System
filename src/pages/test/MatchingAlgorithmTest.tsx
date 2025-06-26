import React from "react";
import { matchVolunteersToResidents, MatchResult } from "@/utils/matchingAlgorithm";
import { useVolunteers } from "@/hooks/useFirestoreVolunteers";
import { useResidents } from "@/hooks/useFirestoreResidents";
import { useMatchingRules } from "@/hooks/useMatchingRules";
import { Timestamp } from "firebase/firestore";
import { Volunteer, Resident, MatchingRule } from "@/services/firestore";

function convertVolunteerUItoVolunteer(volunteerUI: any): Volunteer {
  return {
    ...volunteerUI,
    createdAt: Timestamp.fromDate(new Date(volunteerUI.createdAt)),
  };
}

function convertResidentUItoResident(residentUI: any): Resident {
  return {
    ...residentUI,
    createdAt: Timestamp.fromDate(new Date(residentUI.createdAt)),
  };
}

function convertMatchingRuleUItoMatchingRule(ruleUI: any): MatchingRule {
  return {
    ...ruleUI,
    updatedAt: Timestamp.fromDate(new Date(ruleUI.updatedAt)),
  };
}

const MatchingAlgorithmTest: React.FC = () => {
  const { volunteers, loading: loadingVolunteers } = useVolunteers();
  const { residents, loading: loadingResidents } = useResidents();
  const { rules, loading: loadingRules } = useMatchingRules();

  if (loadingVolunteers || loadingResidents || loadingRules) {
    return <div className="p-8">Loading...</div>;
  }

  if (!volunteers.length || !residents.length || !rules.length) {
    return <div className="p-8 text-red-500">No data available. Please add volunteers, residents, and rules in the system.</div>;
  }

  const convertedVolunteers: Volunteer[] = volunteers.map(convertVolunteerUItoVolunteer);
  const convertedResidents: Resident[] = residents.map(convertResidentUItoResident);
  const convertedRules: MatchingRule[] = rules.map(convertMatchingRuleUItoMatchingRule);

  const results: MatchResult[] = matchVolunteersToResidents(
    convertedVolunteers,
    convertedResidents,
    convertedRules
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Matching Algorithm Test</h1>
      <table className="min-w-full border border-slate-300">
        <thead>
          <tr className="bg-slate-100">
            <th className="border px-4 py-2">Volunteer</th>
            <th className="border px-4 py-2">Resident</th>
            <th className="border px-4 py-2">Score</th>
            <th className="border px-4 py-2">Factors</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, idx) => (
            <tr key={idx}>
              <td className="border px-4 py-2">{convertedVolunteers.find(v => v.id === result.volunteerId)?.fullName}</td>
              <td className="border px-4 py-2">{convertedResidents.find(r => r.id === result.residentId)?.fullName}</td>
              <td className="border px-4 py-2 font-bold">{result.score}</td>
              <td className="border px-4 py-2">
                <ul>
                  {result.factors.map((f, i) => (
                    <li key={i}>{f.name}: {f.score} (weight: {f.weight})</li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MatchingAlgorithmTest; 