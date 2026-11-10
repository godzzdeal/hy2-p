import { useYamlEditor, type IYamlCode } from "@/hooks/configuration/editor/yaml/code/use-yaml-editor";
export function YamlCode(props: IYamlCode) {
  const parent = useYamlEditor(props);
  return <div className="yaml-code flex-1 min-h-0 border border-line" ref={parent} />;
}
