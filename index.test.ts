import { describe, test, expect } from "bun:test";
import {
  createHash,
  createLeafNode,
  createNode,
  evolve,
  getCenterNode,
  type AlmostLeafNode,
} from ".";

describe("createLeafNode", () => {
  test("should create leaf node with proper values", () => {
    const leafNode = createLeafNode({
      nw: false,
      ne: true,
      sw: true,
      se: false,
    });

    expect(leafNode).toEqual({
      nw: false,
      ne: true,
      sw: true,
      se: false,
      level: 0,
      hash: "0110",
    });
  });
});

describe("createNode", () => {
  test("should create node with the proper values", () => {
    const nw = createLeafNode({
      nw: false,
      ne: false,
      sw: false,
      se: true,
    });
    const ne = createLeafNode({
      nw: false,
      ne: false,
      sw: false,
      se: false,
    });
    const sw = createLeafNode({
      nw: false,
      ne: true,
      sw: false,
      se: true,
    });
    const se = createLeafNode({
      nw: false,
      ne: false,
      sw: false,
      se: false,
    });

    const newNode = createNode({ nw, ne, sw, se });

    expect(newNode).toEqual({
      nw,
      ne,
      sw,
      se,
      level: 1,
      hash: "0001000001010000",
    });
  });
});

describe("getCenterNode", () => {
  test("should return the center node one level down", () => {
    const nw = createLeafNode({
      nw: false,
      ne: false,
      sw: false,
      se: true,
    });
    const ne = createLeafNode({
      nw: false,
      ne: false,
      sw: false,
      se: false,
    });
    const sw = createLeafNode({
      nw: false,
      ne: true,
      sw: false,
      se: true,
    });
    const se = createLeafNode({
      nw: false,
      ne: false,
      sw: false,
      se: false,
    });

    /**
     * 0000
     * 0100
     * 0100
     * 0100
     */
    const newNode = createNode({ nw, ne, sw, se });

    expect(getCenterNode(newNode)).toEqual({
      nw: true,
      ne: false,
      sw: true,
      se: false,
      level: 0,
      hash: "1010",
    });
  });
});

describe("createHash", () => {
  test("should create the correct hash for leaf quadrants", () => {
    expect(createHash({ nw: false, ne: true, sw: true, se: false })).toBe(
      "0110"
    );
  });

  test("should create the correct hash for node quadrants", () => {
    expect(
      createHash({
        nw: { hash: "0000" },
        ne: { hash: "1111" },
        sw: { hash: "0000" },
        se: { hash: "1111" },
      } as any)
    ).toBe("0000111100001111");
  });
});

describe("processGol", () => {
  test("properly processes level 1 node", () => {
    const nw = createLeafNode({
      nw: false,
      ne: false,
      sw: false,
      se: true,
    });
    const ne = createLeafNode({
      nw: false,
      ne: false,
      sw: false,
      se: false,
    });
    const sw = createLeafNode({
      nw: false,
      ne: true,
      sw: false,
      se: true,
    });
    const se = createLeafNode({
      nw: false,
      ne: false,
      sw: false,
      se: false,
    });

    /**
     * 0000
     * 0100
     * 0100
     * 0100
     */
    const newNode = createNode({ nw, ne, sw, se });

    expect(evolve(newNode)).toEqual({
      nw: false,
      ne: false,
      sw: true,
      se: true,
      level: 0,
      hash: "0011",
    });
  });
});

describe("evolve", () => {
  test("properly processes level 2 node", () => {
    const nw = createNode({
      nw: createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      ne: createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      sw: createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      se: createLeafNode({
        nw: false,
        ne: true,
        sw: false,
        se: true,
      }),
    });
    const ne = createNode({
      nw: createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      ne: createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      sw: createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      se: createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
    });
    const sw = createNode({
      nw: createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      ne: createLeafNode({
        nw: false,
        ne: true,
        sw: false,
        se: false,
      }),
      sw: createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      se: createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
    });
    const se = createNode({
      nw: createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      ne: createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      sw: createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      se: createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
    });
    const node = createNode({ nw, ne, sw, se });
    const generatedNode: AlmostLeafNode = {
      nw: {
        nw: false,
        ne: false,
        sw: true,
        se: true,
        level: 0,
        hash: "0011",
      },
      ne: {
        nw: false,
        ne: false,
        sw: true,
        se: false,
        level: 0,
        hash: "0010",
      },
      sw: {
        nw: false,
        ne: false,
        sw: false,
        se: false,
        level: 0,
        hash: "0000",
      },
      se: {
        nw: false,
        ne: false,
        sw: false,
        se: false,
        level: 0,
        hash: "0000",
      },
      level: 1,
      hash: "0011001000000000",
    };

    expect(evolve(node)).toEqual(generatedNode as any);
  });
});
