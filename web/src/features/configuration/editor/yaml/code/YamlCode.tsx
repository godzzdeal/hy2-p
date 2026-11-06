import { useYamlEditor, type IYamlCode } from "./use-yaml-editor";
export function YamlCode(props: IYamlCode) {
  const parent = useYamlEditor(props);
  return <div className="yaml-code" ref={parent} />;
}
