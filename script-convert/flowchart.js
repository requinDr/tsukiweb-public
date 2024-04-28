import { LOGIC_FILE } from "./script-convert.js"

const gotoRegexp = /\b.*\s+\*(?<label>\w+\b)/

class TreeNode {

    /**
     * @param {Map<string, TreeNode>} nodes
     * @param {string} name
     */
    static get(nodes, name) {
        let node = nodes.get(name)
        if (!node) {
            node = new TreeNode(name)
            nodes.set(name, node)
        }
        return node
    }

    /**
     * @param {string} name
     */
    constructor(name) {
        /** @type {string} */
        this.name = name;
        /** @type {string|null} */
        this.scene = null;
        /** @type {Array<string>|Array<TreeNode>} */
        this.child_nodes = [];
        /** @type {Array<TreeNode>} */
        this.parent_nodes = [];
    }
    /**
     * @param {string} name 
     */
    setScene(name) {
        if (this.scene != null && this.scene != name)
            throw Error(`Node ${this.name} already has a scene`)
        this.scene = name
    }
    /**
     * @param {TreeNode} node 
     */
    addChild(node) {
        if (!this.child_nodes.includes(node)) {
            this.child_nodes.push(node)
            node.parent_nodes.push(this)
        }
    }
    /**
     * @param {TreeNode} parent_node
     * @param {Map<string, TreeNode>} all_nodes
     */
    delete() {
        for (const c_node of this.child_nodes) {
            for (const p_node of this.parent_nodes) {
                p_node.addChild(c_node)
            }
            c_node.parent_nodes.splice(c_node.parent_nodes.indexOf(this), 1)
        }
        for (const p_node of this.parent_nodes) {
            p_node.child_nodes.splice(p_node.child_nodes.indexOf(this), 1)
        }
    }

}
/**
 * 
 * @param {Map<string, {file: string, lines: Array<String>}} script
 * @returns {Map<string, TreeNode>}
 */
function getFlowchart(script, noLogicScenes = {}) {
    /** @type {Map<string, TreeNode>} */
    const nodes = new Map();
    for(let [name, {file, lines}] of script.entries()) {
        if (file != LOGIC_FILE) {
            if (name in noLogicScenes) {
                const node = TreeNode.get(nodes, name);
                node.setScene(name)
                const {before = [], after = []} = noLogicScenes[name];
                for (const n of before)
                    node.addChild(TreeNode.get(nodes, n));
                for (const n of after)
                    TreeNode.get(nodes, n).addChild(node);
            } else {
                continue;
            }
        } else {
            const node = TreeNode.get(nodes, name)
            for (let line of lines) {
                const match = line.match(gotoRegexp);
                if (match) {
                    const label = match.groups['label'];
                    const target = script.get(label);
                    if (!target)
                        continue
                    if (target.file != LOGIC_FILE)
                        node.setScene(label)
                    else {
                        node.addChild(TreeNode.get(nodes, label))
                    }
                }
            }
        }
    }
    /** @type {Map<string, TreeNode>} */
    const scenesTree = new Map()
    for (const [name, node] of nodes.entries()) {
        if (!node.scene) {
            node.delete()
        } else {
            scenesTree.set(node.scene, node)
        }
    }
    return scenesTree
}

export {
    TreeNode,
    getFlowchart
}