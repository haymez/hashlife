export type Quadrants<T> = {
  nw: T;
  ne: T;
  sw: T;
  se: T;
};

interface BaseNode<T> extends Quadrants<T> {
  level: number;
  hash: string;
}

export interface Node extends BaseNode<Node> {
  result?: Node;
}

export type LeafNode = BaseNode<boolean>;

export type AlmostLeafNode = BaseNode<LeafNode> & {
  result?: LeafNode;
};

type AnyNodeQuadrants =
  | Quadrants<Node>
  | Quadrants<AlmostLeafNode>
  | Quadrants<LeafNode>
  | Quadrants<boolean>;

type AnyNode = Node | AlmostLeafNode | LeafNode;

export function createNode(quadrants: Quadrants<boolean>): LeafNode;
export function createNode(quadrants: Quadrants<LeafNode>): AlmostLeafNode;
export function createNode(quadrants: Quadrants<AlmostLeafNode>): Node;
export function createNode(quadrants: Quadrants<Node>): Node;
export function createNode(quadrants: AnyNodeQuadrants): AnyNode {
  return {
    ...quadrants,
    level: typeof quadrants.nw === "boolean" ? 0 : quadrants.nw.level + 1,
    hash: createHash(quadrants),
  } as AnyNode;
}

export function createLeafNode(quadrants: Quadrants<boolean>): LeafNode {
  const { nw, ne, sw, se } = quadrants;

  return {
    nw,
    ne,
    sw,
    se,
    level: 0,
    hash: createHash(quadrants),
  };
}

export function getCenterNode({ nw, ne, sw, se }: Node): Node;
export function getCenterNode({ nw, ne, sw, se }: AlmostLeafNode): LeafNode;
export function getCenterNode({
  nw,
  ne,
  sw,
  se,
}: Node | AlmostLeafNode): Node | AlmostLeafNode | LeafNode {
  const quadrants = { nw: nw.se, ne: ne.sw, sw: sw.ne, se: se.nw } as
    | Quadrants<Node>
    | Quadrants<AlmostLeafNode>;

  return {
    ...quadrants,
    level: nw.level,
    hash: createHash(quadrants),
  } as Node | AlmostLeafNode | LeafNode;
}

export function createHash({ nw, ne, sw, se }: AnyNodeQuadrants): string {
  if (typeof nw === "boolean") {
    const helper = (val: boolean) => (val ? 1 : 0);

    return `${helper(nw)}${helper(ne)}${helper(sw)}${helper(se)}`;
  }

  return `${nw.hash}${ne.hash}${sw.hash}${se.hash}`;
}

export function evolve(node: Node): Node;
export function evolve(node: AlmostLeafNode): LeafNode;
export function evolve(node: Node | AlmostLeafNode): Node | LeafNode {
  if (isAlmostLeafNode(node)) {
    return processGol(node);
  }

  // Nodes we'll call evolve on
  const n00 = createNode({
    nw: node.nw.nw,
    ne: node.nw.ne,
    sw: node.nw.sw,
    se: node.nw.se,
  });
  const n01 = createNode({
    nw: node.nw.ne,
    ne: node.ne.nw,
    sw: node.nw.se,
    se: node.ne.sw,
  });
  const n02 = createNode({
    nw: node.ne.nw,
    ne: node.ne.ne,
    sw: node.ne.sw,
    se: node.ne.se,
  });
  const n10 = createNode({
    nw: node.nw.sw,
    ne: node.nw.se,
    sw: node.sw.nw,
    se: node.sw.ne,
  });
  const n11 = createNode({
    nw: node.nw.se,
    ne: node.ne.sw,
    sw: node.sw.ne,
    se: node.se.nw,
  });
  const n12 = createNode({
    nw: node.ne.sw,
    ne: node.ne.se,
    sw: node.se.nw,
    se: node.se.ne,
  });
  const n20 = createNode({
    nw: node.sw.nw,
    ne: node.sw.ne,
    sw: node.sw.sw,
    se: node.sw.se,
  });
  const n21 = createNode({
    nw: node.sw.ne,
    ne: node.se.nw,
    sw: node.sw.se,
    se: node.se.sw,
  });
  const n22 = createNode({
    nw: node.se.nw,
    ne: node.se.ne,
    sw: node.se.sw,
    se: node.se.se,
  });

  // Calling evolve (this returns the center nodes of values above)
  const n00Evolved = evolve(n00);
  const n01Evolved = evolve(n01);
  const n02Evolved = evolve(n02);
  const n10Evolved = evolve(n10);
  const n11Evolved = evolve(n11);
  const n12Evolved = evolve(n12);
  const n20Evolved = evolve(n20);
  const n21Evolved = evolve(n21);
  const n22Evolved = evolve(n22);

  // These are to help construct central evolved node of original `node`
  const nw = createNode({
    nw: n00Evolved,
    ne: n01Evolved,
    sw: n10Evolved,
    se: n11Evolved,
  });
  const ne = createNode({
    nw: n01Evolved,
    ne: n02Evolved,
    sw: n11Evolved,
    se: n12Evolved,
  });
  const sw = createNode({
    nw: n10Evolved,
    ne: n11Evolved,
    sw: n20Evolved,
    se: n21Evolved,
  });
  const se = createNode({
    nw: n11Evolved,
    ne: n12Evolved,
    sw: n21Evolved,
    se: n22Evolved,
  });

  // This is the center node of the original node but evolved
  const result = createNode({
    nw: getCenterNode(nw),
    ne: getCenterNode(ne),
    sw: getCenterNode(sw),
    se: getCenterNode(se),
  });

  node.result = result;

  return result;
}

export function processGol(node: AlmostLeafNode): LeafNode {
  // /**
  //  * 0000
  //  * 0000
  //  * 0000
  //  * 0000
  //  */
  const cells = [
    [node.nw.nw, node.nw.ne, node.ne.nw, node.ne.ne],
    [node.nw.sw, node.nw.se, node.ne.sw, node.ne.se],
    [node.sw.nw, node.sw.ne, node.se.nw, node.se.ne],
    [node.sw.sw, node.sw.se, node.se.sw, node.se.se],
  ].map((arr) => arr.map((i) => (i ? 1 : 0)));

  const nextState = [
    [false, false],
    [false, false],
  ];

  for (let y = 1; y < 3; y++) {
    for (let x = 1; x < 3; x++) {
      const isAlive = cells[y][x] === 1;
      const living =
        cells[y - 1][x - 1] +
        cells[y - 1][x] +
        cells[y - 1][x + 1] +
        cells[y][x - 1] +
        cells[y][x + 1] +
        cells[y + 1][x - 1] +
        cells[y + 1][x] +
        cells[y + 1][x + 1];

      nextState[y - 1][x - 1] = living === 3 || (isAlive && living === 2);
    }
  }

  const result = createLeafNode({
    nw: nextState[0][0],
    ne: nextState[0][1],
    sw: nextState[1][0],
    se: nextState[1][1],
  });

  node.result = result;

  return result;
}

function isAlmostLeafNode(node: Node | AlmostLeafNode): node is AlmostLeafNode {
  return typeof node.nw.nw === "boolean";
}
