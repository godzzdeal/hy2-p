package ordering

import (
	_ "embed"
	"encoding/json"
	"gopkg.in/yaml.v3"
	"sort"
)

//go:embed order.json
var schema []byte

var fields = load()

func load() map[string][]string {
	var result map[string][]string
	if err := json.Unmarshal(schema, &result); err != nil {
		panic(err)
	}
	return result
}

// Marshal keeps runtime configuration in the same order as the documented editor.
func Marshal(value any) ([]byte, error) {
	var node yaml.Node
	if err := node.Encode(value); err != nil {
		return nil, err
	}
	sortNode(&node, "")
	return yaml.Marshal(&node)
}
func sortNode(node *yaml.Node, path string) {
	if node.Kind == yaml.MappingNode {
		pairs := make([][]*yaml.Node, 0, len(node.Content)/2)
		for index := 0; index < len(node.Content); index += 2 {
			key, value := node.Content[index], node.Content[index+1]
			next := key.Value
			if path != "" {
				next = path + "." + next
			}
			sortNode(value, next)
			pairs = append(pairs, []*yaml.Node{key, value})
		}
		rank := func(key string) int {
			for index, name := range fields[path] {
				if name == key {
					return index
				}
			}
			return len(fields[path])
		}
		sort.SliceStable(pairs, func(left, right int) bool {
			return rank(pairs[left][0].Value) < rank(pairs[right][0].Value)
		})
		node.Content = node.Content[:0]
		for _, pair := range pairs {
			node.Content = append(node.Content, pair...)
		}
	} else if node.Kind == yaml.SequenceNode {
		for _, item := range node.Content {
			sortNode(item, path+"[]")
		}
	}
}
