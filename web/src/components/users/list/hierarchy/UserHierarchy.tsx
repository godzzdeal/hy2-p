import { GroupMembersDialog } from "@/components/groups/members/GroupMembersDialog";
import { GroupSection } from "@/components/users/list/hierarchy/GroupSection";
import { UserTable } from "@/components/users/list/UserTable";
import { useTraffic } from "@/hooks/users/traffic/use-traffic";
import { TrafficStatus } from "@/components/users/list/hierarchy/TrafficStatus";
import { type IUserActions } from "@/components/users/list/row/actions/UserActions";
import { type IUserGroupSection } from "@/services/groups/membership";
import { type IGroup } from "@/services/groups/types";
import { useState } from "react";

interface IUserHierarchy extends IUserActions {
  sections: IUserGroupSection[];
}
export function UserHierarchy({ sections, ...actions }: IUserHierarchy) {
  const [group, setGroup] = useState<IGroup>();
  const traffic = useTraffic();
  return (
    <>
      <TrafficStatus />
      <div className="user-hierarchy">
        <UserTable hasStatus={false}>
          {sections.map((section) => (
            <GroupSection
              key={section.id}
              section={section}
              onMembers={setGroup}
              traffic={traffic.data}
              {...actions}
            />
          ))}
        </UserTable>
      </div>
      {group && <GroupMembersDialog group={group} onClose={() => setGroup(undefined)} />}
    </>
  );
}
