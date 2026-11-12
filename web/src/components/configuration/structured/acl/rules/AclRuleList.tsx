import { AclRuleRow, type IAclRuleRow } from "./AclRuleRow";

interface IAclRuleList extends Omit<IAclRuleRow, "index" | "source" | "rule"> {
  rows: Pick<IAclRuleRow, "index" | "source" | "rule">[];
}

export function AclRuleList({ rows, ...props }: IAclRuleList) {
  if (!rows.length) return null;
  return (
    <div className="grid min-w-0 border-2 border-line bg-input">
      {rows.map((row) => (
        <AclRuleRow key={row.index} {...row} {...props} />
      ))}
    </div>
  );
}
