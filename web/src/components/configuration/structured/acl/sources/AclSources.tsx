import { ACL_FILE_KINDS } from "@/services/configuration/tools";
import type { IAclEditor } from "@/hooks/configuration/acl";
import { readField } from "@/utils/configuration/structured/yaml/fields";
import { AclSource } from "./AclSource";

export function AclSources({ document, onSet }: IAclEditor) {
  return (
    <div className="grid min-w-0 gap-4">
      {ACL_FILE_KINDS.map((kind) => (
        <AclSource
          key={kind}
          kind={kind}
          value={String(readField(document, "acl." + kind) ?? "")}
          onSet={onSet}
        />
      ))}
    </div>
  );
}
