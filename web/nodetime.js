import { app } from "/scripts/app.js"
import { api } from "/scripts/api.js"

// Execution id -> time in ms, or "cached". Nodes inside a subgraph have ids like "12:5",
// and their time is also added to the enclosing subgraph nodes ("12").
let times = new Map()
let current = null
let start = 0

function add(id, ms) {
    const prev = times.get(id)
    times.set(id, (typeof prev === "number" ? prev : 0) + ms)
}

function stop() {
    if (current === null) return
    const ms = performance.now() - start
    const parts = current.split(":")
    for (let i = parts.length; i > 0; i--) add(parts.slice(0, i).join(":"), ms)
    current = null
}

function lookup(node) {
    if (app.canvas.graph === app.graph) return times.get(String(node.id))
    // Inside a subgraph the canvas only knows the local id. If the same subgraph is used
    // several times, the first match wins.
    const suffix = ":" + node.id
    for (const [id, t] of times) if (id.endsWith(suffix)) return t
}

function format(t) {
    if (t === "cached") return "cache"
    if (t < 1000) return `${Math.round(t)} ms`
    if (t < 60000) return `${(t / 1000).toFixed(1)} s`
    const s = Math.round(t / 1000)
    return `${Math.floor(s / 60)}m${String(s % 60).padStart(2, "0")}s`
}

function drawBadge(ctx, node, t) {
    const text = format(t)
    const [x, y, w] = node.boundingRect
    ctx.save()
    ctx.font = "12px sans-serif"
    const width = ctx.measureText(text).width + 12
    const bx = x + w - width
    const by = y - 22
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)"
    ctx.beginPath()
    ctx.roundRect(bx, by, width, 18, 4)
    ctx.fill()
    ctx.fillStyle = t === "cached" ? "#999" : "#fff"
    ctx.textBaseline = "middle"
    ctx.fillText(text, bx + 6, by + 9)
    ctx.restore()
}

app.registerExtension({
    name: "comfyui_davcha_nodetime",
    setup() {
        api.addEventListener("execution_start", () => {
            times = new Map()
            current = null
        })
        api.addEventListener("executing", ({ detail }) => {
            stop()
            if (detail == null) return
            current = String(detail)
            start = performance.now()
        })
        api.addEventListener("execution_cached", ({ detail }) => {
            for (const id of detail.nodes) times.set(String(id), "cached")
        })
        for (const event of ["execution_success", "execution_error", "execution_interrupted"]) {
            api.addEventListener(event, stop)
        }

        // Only the hovered node gets a badge. The canvas already redraws when node_over changes.
        const onDrawForeground = app.canvas.onDrawForeground
        app.canvas.onDrawForeground = function (ctx, area) {
            onDrawForeground?.apply(this, arguments)
            const node = this.node_over
            if (!node) return
            const t = lookup(node)
            if (t !== undefined) drawBadge(ctx, node, t)
        }
    },
})
