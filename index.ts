type Quadrants = {
  nw: HLNode;
  ne: HLNode;
  sw: HLNode;
  se: HLNode;
};

type Cells = {
  nw: boolean;
  ne: boolean;
  sw: boolean;
  se: boolean;
};

export class HLNode {
  nw: HLNode;
  ne: HLNode;
  sw: HLNode;
  se: HLNode;
  level: number;
  hash: string;
  result?: HLNode;

  constructor(quadrants: Quadrants | Cells) {
    if (typeof quadrants.nw === "boolean") {
      this.nw = null as any;
      this.ne = null as any;
      this.sw = null as any;
      this.se = null as any;
      this.level = 0;
      this.hash = HLNode.hashKey(quadrants);
    } else {
      this.nw = quadrants.nw;
      this.ne = quadrants.ne;
      this.sw = quadrants.sw;
      this.se = quadrants.se;
      this.level = quadrants.nw.level + 1;
      this.hash = HLNode.hashKey(quadrants);
    }
  }

  static hashKey({ nw, ne, sw, se }: Quadrants | Cells) {
    if (typeof nw === "boolean") {
      const stateToString = (val: boolean) => (val ? "1" : "0");

      return [
        stateToString(nw),
        stateToString(ne),
        stateToString(sw),
        stateToString(se),
      ].join("");
    }

    return `${nw.hash}-${ne.hash}-${sw.hash}-${se.hash}`;
  }

  static fromLeaf(cells: Cells): HLNode {
    return new NodeLeaf(cells);
  }
}

class NodeLeaf extends HLNode {
  cells: {
    nw: boolean;
    ne: boolean;
    sw: boolean;
    se: boolean;
  };

  constructor(cells: Cells) {
    super(cells);
    this.cells = cells;
  }
}

export class World {
  nodeCache: Map<string, HLNode>;

  constructor() {
    this.nodeCache = new Map<string, HLNode>();
  }

  findOrCreateNode(quadrants: Quadrants | Cells): HLNode {
    const key = HLNode.hashKey(quadrants);

    return this.nodeCache.get(key) || this.createNode(quadrants);
  }

  private createNode(quadrants: Quadrants | Cells): HLNode {
    const key = HLNode.hashKey(quadrants);
    const newNode = new HLNode(quadrants);

    this.nodeCache.set(key, newNode);

    return newNode;
  }

  evolve(node: HLNode): HLNode {
    if (node instanceof NodeLeaf) {
      return this.evolveLeaf(node);
    }

    if (node.result) return node.result;

    const { nw, ne, sw, se } = node;
    const n00 = nw.nw,
      n01 = nw.ne,
      n02 = ne.nw;
    const n10 = nw.sw,
      n11 = nw.se,
      n12 = ne.sw;
    const n20 = sw.nw,
      n21 = sw.ne,
      n22 = se.nw;
    const a = this.createNode({ nw: n00, ne: n01, sw: n10, se: n11 });
    const b = this.createNode({ nw: n01, ne: n02, sw: n11, se: n12 });
    const c = this.createNode({ nw: n10, ne: n11, sw: n20, se: n21 });
    const d = this.createNode({ nw: n11, ne: n12, sw: n21, se: n22 });
    const eA = this.evolve(a);
    const eB = this.evolve(b);
    const eC = this.evolve(c);
    const eD = this.evolve(d);
    const result = this.createNode({nw: eA, ne: eB, sw: eC, se: eD});

    node.result = result

    return result
  }

  evolveLeaf(node: NodeLeaf): HLNode {
    return node;
  }
}
