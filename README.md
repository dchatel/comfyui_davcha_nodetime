# comfyui_davcha_nodetime

Shows how long each ComfyUI node took in the last run, in a small badge above the node, only
while the mouse is over it. Nodes served from the cache show `cache`.

Subgraph nodes show the total time of the nodes inside them, and the nodes inside a subgraph
show their own time when the subgraph is open.

## Installation

Clone this repository into `ComfyUI/custom_nodes` and restart ComfyUI:

```
cd ComfyUI/custom_nodes
git clone https://github.com/dchatel/comfyui_davcha_nodetime
```

It adds no nodes and has no settings or dependencies.

## License

MIT
