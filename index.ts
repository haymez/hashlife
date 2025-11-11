type Quadrants<T> = {
  nw: T;
  ne: T;
  sw: T;
  se: T;
};

class HashCommon {
  level: number;
  hash: string;

  constructor(level: number, hash: string) {
    this.level = level;
    this.hash = hash;
  }
}

class HashLeaf extends HashCommon {
  nw: boolean;
  ne: boolean;
  sw: boolean;
  se: boolean;
  result?: HashLeaf;

  constructor(quadrants: Quadrants<boolean>) {
    super(0, hashKey(quadrants));
    this.nw = quadrants.nw;
    this.ne = quadrants.ne;
    this.sw = quadrants.sw;
    this.se = quadrants.se;
  }
}

class HashNode extends HashCommon {
  nw: HashNode;
  ne: HashNode;
  sw: HashNode;
  se: HashNode;
  result?: HashNode;

  constructor(quadrants: Quadrants<HashNode>) {
    super(quadrants.nw.level + 1, hashKey(quadrants));
    this.nw = quadrants.nw;
    this.ne = quadrants.ne;
    this.sw = quadrants.sw;
    this.se = quadrants.se;
  }
}

function hashKey(quadrants: Quadrants<HashNode> | Quadrants<boolean>) {
  if (isLeaf(quadrants)) {
    const stateToString = (val: boolean) => (val ? "1" : "0");

    return [
      stateToString(quadrants.nw),
      stateToString(quadrants.ne),
      stateToString(quadrants.sw),
      stateToString(quadrants.se),
    ].join("");
  }

  return `${quadrants.nw.hash}-${quadrants.ne.hash}-${quadrants.sw.hash}-${quadrants.se.hash}`;
}

function isLeaf(
  quadrants: Quadrants<HashNode> | Quadrants<boolean>
): quadrants is Quadrants<boolean> {
  return typeof quadrants.nw === "boolean";
}

export class World {
  nodeCache: Map<string, HashNode | HashLeaf> = new Map();

  createNode(quadrants: Quadrants<HashNode>): HashNode {
    const key = hashKey(quadrants);

    if (this.nodeCache.has(key)) {
      return this.nodeCache.get(key) as HashNode;
    }

    const node = new HashNode(quadrants);
    this.nodeCache.set(key, node);

    return node;
  }

  createLeaf(quadrants: Quadrants<boolean>): HashLeaf {
    const key = hashKey(quadrants);

    if (this.nodeCache.has(key)) {
      return this.nodeCache.get(key) as HashLeaf;
    }

    const node = new HashLeaf(quadrants);
    this.nodeCache.set(key, node);

    return node;
  }

  evolve<T extends HashNode | HashLeaf>(node: T): T {
    if (node instanceof HashLeaf) {
      return this.evolveLeaf(node) as T;
    }

    if (node.result) return node.result as T;

    const { nw, ne, sw, se } = node;
    const n00 = nw.nw;
    const n01 = nw.ne;
    const n02 = ne.nw;
    const n10 = nw.sw;
    const n11 = nw.se;
    const n12 = ne.sw;
    const n20 = sw.nw;
    const n21 = sw.ne;
    const n22 = se.nw;

    const a = this.createNode({ nw: n00, ne: n01, sw: n10, se: n11 });
    const b = this.createNode({ nw: n01, ne: n02, sw: n11, se: n12 });
    const c = this.createNode({ nw: n10, ne: n11, sw: n20, se: n21 });
    const d = this.createNode({ nw: n11, ne: n12, sw: n21, se: n22 });

    const eA = this.evolve(a);
    const eB = this.evolve(b);
    const eC = this.evolve(c);
    const eD = this.evolve(d);

    const result = this.createNode({ nw: eA, ne: eB, sw: eC, se: eD });

    node.result = result;

    return result as T;
  }

  evolveLeaf(node: HashLeaf): HashLeaf {
    const cells: number[][] = [
      [0, 0, 0, 0],
      [0, node.nw ? 1 : 0, node.ne ? 1 : 0, 0],
      [0, node.sw ? 1 : 0, node.se ? 1 : 0, 0],
      [0, 0, 0, 0],
    ];
    const nextCells = [
      [false, false],
      [false, false],
    ];

    for (let y = 1; y <= 2; y++) {
      for (let x = 1; x <= 2; x++) {
        const aliveNeighbors =
          cells[y - 1][x - 1] +
          cells[y - 1][x] +
          cells[y - 1][x + 1] +
          cells[y][x - 1] +
          cells[y][x + 1] +
          cells[y + 1][x - 1] +
          cells[y + 1][x] +
          cells[y + 1][x + 1];
        const isAlive = cells[y][x] === 1;
        const nextState =
          aliveNeighbors === 3 || (isAlive && aliveNeighbors === 2);
        nextCells[y - 1][x - 1] = nextState;
      }
    }

    return this.createLeaf({
      nw: nextCells[0][0],
      ne: nextCells[0][1],
      sw: nextCells[1][0],
      se: nextCells[1][1],
    });
  }
}
