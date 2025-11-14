type Quadrants<T> = { nw: T; ne: T; sw: T; se: T };

abstract class BaseNode<Data> {
  nw: Data;
  ne: Data;
  sw: Data;
  se: Data;
  level: number;
  hash: string;
  result?: BaseNode<Data>;
  constructor(level: number, hash: string, quadrants: Quadrants<Data>) {
    this.level = level;
    this.hash = hash;
    this.nw = quadrants.nw;
    this.ne = quadrants.ne;
    this.sw = quadrants.sw;
    this.se = quadrants.se;
  }
}

class HashNode extends BaseNode<HashNode> {
  constructor(quadrants: Quadrants<HashNode>) {
    super(quadrants.nw.level + 1, hashKey(quadrants), quadrants);
  }
}

class HashLeaf extends BaseNode<boolean> {
  constructor(quadrants: Quadrants<boolean>) {
    super(0, hashKey(quadrants), quadrants);
  }
}

function hashKey(q: Quadrants<HashNode> | Quadrants<boolean>) {
  if (typeof q.nw === "boolean") {
    return [q.nw, q.ne, q.sw, q.se].map((v) => (v ? "1" : "0")).join("");
  }

  return [q.nw.hash, q.ne.hash, q.sw.hash, q.se.hash].join("-");
}

export class World {
  nodeCache = new Map<string, HashNode | HashLeaf>();

  createLeaf(q: Quadrants<boolean>): HashLeaf {
    const key = hashKey(q);
    if (this.nodeCache.has(key)) return this.nodeCache.get(key) as HashLeaf;
    const leaf = new HashLeaf(q);
    this.nodeCache.set(key, leaf);

    return leaf;
  }

  createNode(q: Quadrants<HashNode>): HashNode {
    const key = hashKey(q);
    if (this.nodeCache.has(key)) return this.nodeCache.get(key) as HashNode;
    const node = new HashNode(q);
    this.nodeCache.set(key, node);

    return node;
  }

  evolve(node: HashNode | HashLeaf): HashNode | HashLeaf {
    if (node instanceof HashLeaf) return this.evolveLeaf(node);
    if (node.result) return node.result;

    const { nw, ne, sw, se } = node as HashNode;

    // recurse
    const a = this.createNode({ nw: nw.nw, ne: nw.ne, sw: nw.sw, se: nw.se });
    const b = this.createNode({ nw: ne.nw, ne: ne.ne, sw: ne.sw, se: ne.se });
    const c = this.createNode({ nw: sw.nw, ne: sw.ne, sw: sw.sw, se: sw.se });
    const d = this.createNode({ nw: se.nw, ne: se.ne, sw: se.sw, se: se.se });

    const result = this.createNode({
      nw: this.evolve(a) as HashNode,
      ne: this.evolve(b) as HashNode,
      sw: this.evolve(c) as HashNode,
      se: this.evolve(d) as HashNode,
    });

    node.result = result;
    return result;
  }

  evolveLeaf(node: HashLeaf): HashLeaf {
    const cells = [
      [0, 0, 0, 0],
      [0, node.nw ? 1 : 0, node.ne ? 1 : 0, 0],
      [0, node.sw ? 1 : 0, node.se ? 1 : 0, 0],
      [0, 0, 0, 0],
    ];

    const next = [
      [false, false],
      [false, false],
    ];

    for (let y = 1; y <= 2; y++) {
      for (let x = 1; x <= 2; x++) {
        const n =
          cells[y - 1][x - 1] +
          cells[y - 1][x] +
          cells[y - 1][x + 1] +
          cells[y][x - 1] +
          cells[y][x + 1] +
          cells[y + 1][x - 1] +
          cells[y + 1][x] +
          cells[y + 1][x + 1];
        const alive = cells[y][x] === 1;
        const nextState = n === 3 || (alive && n === 2);
        next[y - 1][x - 1] = nextState;
      }
    }

    return this.createLeaf({
      nw: next[0][0],
      ne: next[0][1],
      sw: next[1][0],
      se: next[1][1],
    });
  }
}
