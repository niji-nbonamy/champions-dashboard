import { RosterList } from "@/app/(dashboard)/students/roster-list";
import type { ActiveStudent } from "@/lib/services/list-active-students";

type StepLevelsProps = {
  students: ActiveStudent[];
  assignedCount: number;
  totalCount: number;
};

export function StepLevels({
  students,
  assignedCount,
  totalCount,
}: StepLevelsProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Assignez un niveau couleur à chaque élève. Tous les élèves doivent
        avoir un niveau avant de continuer.
      </p>
      <p className="text-sm font-medium">
        Niveaux assignés : {assignedCount}/{totalCount}
      </p>
      <RosterList students={students} showLevelUi />
    </div>
  );
}
