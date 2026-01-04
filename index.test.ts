import { describe, test, expect, spyOn } from "bun:test";
import * as Hashlife from ".";
import {
  createHash,
  getCenterNode,
  World,
  type AlmostLeafNode,
  type Node,
} from ".";

describe("createLeafNode", () => {
  test("should create leaf node with proper values", () => {
    const world = new World();
    const leafNode = world.createLeafNode({
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
    const world = new World();
    const nw = world.createLeafNode({
      nw: false,
      ne: false,
      sw: false,
      se: true,
    });
    const ne = world.createLeafNode({
      nw: false,
      ne: false,
      sw: false,
      se: false,
    });
    const sw = world.createLeafNode({
      nw: false,
      ne: true,
      sw: false,
      se: true,
    });
    const se = world.createLeafNode({
      nw: false,
      ne: false,
      sw: false,
      se: false,
    });

    const newNode = world.createNode({ nw, ne, sw, se });

    expect(newNode).toEqual({
      nw,
      ne,
      sw,
      se,
      level: 1,
      hash: "0001000001010000",
    });
  });

  test("createNode caches things properly", () => {
    const world = new World();
    const createNodeSpy = spyOn(world, "createNode");
    const cacheSetSpy = spyOn(world.cache, "set");

    world.createNode({ nw: true, ne: true, sw: true, se: true });
    world.createNode({ nw: true, ne: true, sw: true, se: true });
    world.createNode({ nw: true, ne: true, sw: true, se: true });

    expect(createNodeSpy).toHaveBeenCalledTimes(3);
    expect(cacheSetSpy).toHaveBeenCalledTimes(1);
  });
});

describe("getCenterNode", () => {
  test("should return the center node one level down", () => {
    const world = new World();
    const nw = world.createLeafNode({
      nw: false,
      ne: false,
      sw: false,
      se: true,
    });
    const ne = world.createLeafNode({
      nw: false,
      ne: false,
      sw: true,
      se: false,
    });
    const sw = world.createLeafNode({
      nw: false,
      ne: true,
      sw: false,
      se: true,
    });
    const se = world.createLeafNode({
      nw: true,
      ne: false,
      sw: false,
      se: false,
    });

    /**
     * 0000
     * 0110
     * 0110
     * 0000
     */
    const node = world.createNode({ nw, ne, sw, se });

    expect(node.level).toEqual(1);
    expect(getCenterNode(node)).toEqual({
      nw: true,
      ne: true,
      sw: true,
      se: true,
      level: 0,
      hash: "1111",
    });
  });
});

describe("createDeadDuplicateFor", () => {
  test("should create a duplicate node where all leaf values are false", () => {
    const world = new World();
    const nw = world.createLeafNode({
      nw: true,
      ne: true,
      sw: true,
      se: true,
    });
    const ne = world.createLeafNode({
      nw: true,
      ne: true,
      sw: true,
      se: true,
    });
    const sw = world.createLeafNode({
      nw: true,
      ne: true,
      sw: true,
      se: true,
    });
    const se = world.createLeafNode({
      nw: true,
      ne: true,
      sw: true,
      se: true,
    });

    /**
     * 1111
     * 1111
     * 1111
     * 1111
     */
    const newNode = world.createNode({ nw, ne, sw, se });

    expect(world.createDeadDuplicateFor(newNode)).toEqual({
      nw: {
        nw: false,
        ne: false,
        sw: false,
        se: false,
        level: 0,
        hash: "0000",
      },
      ne: {
        nw: false,
        ne: false,
        sw: false,
        se: false,
        level: 0,
        hash: "0000",
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
      hash: "0000000000000000",
    });
  });

  test("should work for leaf nodes as well", () => {
    const world = new World();
    const node = world.createLeafNode({
      nw: true,
      ne: true,
      sw: true,
      se: true,
    });

    expect(world.createDeadDuplicateFor(node)).toEqual({
      nw: false,
      ne: false,
      sw: false,
      se: false,
      level: 0,
      hash: "0000",
    });
  });
});

describe("addBorder", () => {
  test("should add a border correctly", () => {
    const world = new World();
    const leafNode = world.createLeafNode({
      nw: true,
      ne: true,
      sw: true,
      se: true,
    });

    expect(world.addBorder(leafNode)).toEqual({
      nw: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: true,
      }),
      ne: world.createLeafNode({
        nw: false,
        ne: false,
        sw: true,
        se: false,
      }),
      sw: world.createLeafNode({
        nw: false,
        ne: true,
        sw: false,
        se: false,
      }),
      se: world.createLeafNode({
        nw: true,
        ne: false,
        sw: false,
        se: false,
      }),
      level: 1,
      hash: "0001001001001000",
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
    const world = new World();
    const nw = world.createLeafNode({
      nw: false,
      ne: false,
      sw: false,
      se: true,
    });
    const ne = world.createLeafNode({
      nw: false,
      ne: false,
      sw: false,
      se: false,
    });
    const sw = world.createLeafNode({
      nw: false,
      ne: true,
      sw: false,
      se: true,
    });
    const se = world.createLeafNode({
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
    const newNode = world.createNode({ nw, ne, sw, se });

    expect(world.evolve(newNode)).toEqual({
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
    const world = new World();
    const nw = world.createNode({
      nw: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      ne: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      sw: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      se: world.createLeafNode({
        nw: false,
        ne: true,
        sw: false,
        se: true,
      }),
    });
    const ne = world.createNode({
      nw: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      ne: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      sw: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      se: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
    });
    const sw = world.createNode({
      nw: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      ne: world.createLeafNode({
        nw: false,
        ne: true,
        sw: false,
        se: false,
      }),
      sw: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      se: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
    });
    const se = world.createNode({
      nw: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      ne: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      sw: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      se: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
    });

    /**
     * 00000000
     * 00000000
     * 00010000
     * 00010000
     * 00010000
     * 00000000
     * 00000000
     * 00000000
     */
    const node = world.createNode({ nw, ne, sw, se });
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

    expect(world.evolve(node)).toEqual(generatedNode as any);
  });
});

describe("printNode", () => {
  test("should print leaf node", () => {
    const world = new World();
    const node = world.createLeafNode({
      nw: false,
      ne: true,
      sw: false,
      se: true,
    });

    expect(world.printNode(node as any)).toBe("01\n01");
  });
});

describe("hasLivingCellOnEdge", () => {
  test("should return false when no cells on the edge are true", () => {
    const world = new World();
    /**
     * 0000
     * 0110
     * 0110
     * 0000
     */
    const node = world.createNode({
      nw: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      ne: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      sw: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      se: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
    });

    expect(world.hasLivingCellOnEdge(node as any)).toEqual(false);
  });

  test("should return false when no cells on the edge are true test 2", () => {
    const world = new World();
    const node = world.createNode({
      nw: world.createNode({
        nw: world.createLeafNode({
          nw: false,
          ne: false,
          sw: false,
          se: true,
        }) as any,
        ne: world.createLeafNode({
          nw: false,
          ne: false,
          sw: true,
          se: true,
        }) as any,
        sw: world.createLeafNode({
          nw: false,
          ne: true,
          sw: false,
          se: true,
        }) as any,
        se: world.createLeafNode({
          nw: true,
          ne: true,
          sw: true,
          se: true,
        }) as any,
      }) as any,
      ne: world.createNode({
        nw: world.createLeafNode({
          nw: false,
          ne: false,
          sw: true,
          se: false,
        }) as any,
        ne: world.createLeafNode({
          nw: true,
          ne: true,
          sw: true,
          se: true,
        }) as any,
        sw: world.createLeafNode({
          nw: true,
          ne: true,
          sw: true,
          se: true,
        }) as any,
        se: world.createLeafNode({
          nw: true,
          ne: false,
          sw: true,
          se: false,
        }) as any,
      }) as any,
      /**
       * 00000000
       * 01111110
       * 01111110
       * 01111110
       * 01111110
       * 01111110
       * 01111110
       * 00000000
       */
      sw: world.createNode({
        nw: world.createLeafNode({
          nw: false,
          ne: true,
          sw: false,
          se: true,
        }) as any,
        ne: world.createLeafNode({
          nw: true,
          ne: true,
          sw: true,
          se: true,
        }) as any,
        sw: world.createLeafNode({
          nw: false,
          ne: true,
          sw: false,
          se: false,
        }) as any,
        se: world.createLeafNode({
          nw: true,
          ne: true,
          sw: true,
          se: true,
        }) as any,
      }) as any,
      se: world.createNode({
        nw: world.createLeafNode({
          nw: true,
          ne: true,
          sw: true,
          se: true,
        }) as any,
        ne: world.createLeafNode({
          nw: true,
          ne: true,
          sw: true,
          se: true,
        }) as any,
        sw: world.createLeafNode({
          nw: true,
          ne: true,
          sw: true,
          se: true,
        }) as any,
        se: world.createLeafNode({
          nw: true,
          ne: true,
          sw: true,
          se: true,
        }) as any,
      }) as any,
    });

    expect(world.hasLivingCellOnEdge(node as any)).toEqual(false);
  });

  test("should return true when a cell on the right edge is true", () => {
    const world = new World();
    /**
     * 0000
     * 0000
     * 0001
     * 0000
     *
     * `0000000000000100`
     */
    const node = world.createNode({
      nw: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      ne: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      sw: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      se: world.createLeafNode({
        nw: false,
        ne: true,
        sw: false,
        se: false,
      }),
    });

    expect(world.hasLivingCellOnEdge(node as any)).toEqual(true);
  });

  test("should return true when a cell on the left edge is true", () => {
    const world = new World();
    /**
     * 0000
     * 1000
     * 0000
     * 0000
     *
     * `0010000000000000`
     */
    const node = world.createNode({
      nw: world.createLeafNode({
        nw: false,
        ne: false,
        sw: true,
        se: false,
      }),
      ne: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      sw: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      se: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
    });

    expect(world.hasLivingCellOnEdge(node as any)).toEqual(true);
  });

  test("should return true when a cell on the top edge is true", () => {
    const world = new World();
    /**
     * 0010
     * 0000
     * 0000
     * 0000
     *
     * `0000100000000000`
     */
    const node = world.createNode({
      nw: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      ne: world.createLeafNode({
        nw: true,
        ne: false,
        sw: false,
        se: false,
      }),
      sw: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      se: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
    });

    expect(world.hasLivingCellOnEdge(node as any)).toEqual(true);
  });

  test("should return true when a cell on the bottom edge is true", () => {
    const world = new World();
    /**
     * 0000
     * 0000
     * 0000
     * 0100
     *
     * `0000000000100000`
     */
    const node = world.createNode({
      nw: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      ne: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
      sw: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: true,
      }),
      se: world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      }),
    });

    expect(world.hasLivingCellOnEdge(node as any)).toEqual(true);
  });

  test("should return false when larger world has living cells but not on edge", () => {
    // test.only("should return false when larger world has living cells but not on edge", () => {
    const world = new World();
    const l0Node = world.createLeafNode({
      nw: true,
      ne: true,
      sw: true,
      se: true,
    });
    const l1Node = world.createNode({
      nw: l0Node,
      ne: l0Node,
      sw: l0Node,
      se: l0Node,
    }) as any as Node;

    const node = world.createNode({
      nw: l1Node,
      ne: l1Node,
      sw: l1Node,
      se: l1Node,
    });

    world.root = world.addBorder(node);

    expect(world.root.level).toEqual(3);
    expect(world.hasLivingCellOnEdge(world.root)).toEqual(false);
  });
});

describe("nextGen", () => {
  describe("when living cells are at edge of world", () => {
    test("should properly evolve without growing world", () => {
      const world = new World();
      /**
       * 0000
       * 0100
       * 0100
       * 0100
       */
      const node = world.createNode({
        nw: world.createLeafNode({
          nw: false,
          ne: false,
          sw: false,
          se: true,
        }),
        ne: world.createLeafNode({
          nw: false,
          ne: false,
          sw: false,
          se: false,
        }),
        sw: world.createLeafNode({
          nw: false,
          ne: true,
          sw: false,
          se: true,
        }),
        se: world.createLeafNode({
          nw: false,
          ne: false,
          sw: false,
          se: false,
        }),
      });
      world.root = node as any;
      const emptyLeaf = world.createLeafNode({
        nw: false,
        ne: false,
        sw: false,
        se: false,
      });
      /**
       * 00000000
       * 00000000
       * 00000000
       * 00000000
       * 00111000
       * 00000000
       * 00000000
       * 00000000
       */
      const nextGen = world.addBorder(
        world.createNode({
          nw: emptyLeaf,
          ne: emptyLeaf,
          sw: world.createLeafNode({
            nw: true,
            ne: true,
            sw: false,
            se: false,
          }),
          se: world.createLeafNode({
            nw: true,
            ne: false,
            sw: false,
            se: false,
          }),
        })
      );

      world.nextGen();

      expect(world.root.level).toEqual(2);
      expect(world.root).toEqual(nextGen);
    });
  });

  describe("when no living cells are at edge of world", () => {
    test("should properly set next generation of world", () => {
      const world = new World();
      /**
       * 0000
       * 0100
       * 0100
       * 0000
       */
      const node = world.createNode({
        nw: world.createLeafNode({
          nw: false,
          ne: false,
          sw: false,
          se: true,
        }),
        ne: world.createLeafNode({
          nw: false,
          ne: false,
          sw: false,
          se: false,
        }),
        sw: world.createLeafNode({
          nw: false,
          ne: true,
          sw: false,
          se: false,
        }),
        se: world.createLeafNode({
          nw: false,
          ne: false,
          sw: false,
          se: false,
        }),
      });
      world.root = node as any;
      const nextGen = world.createDeadDuplicateFor(node);

      world.nextGen();

      expect(world.root.level).toEqual(1);
      expect(world.root).toEqual(nextGen as any);
    });
  });

  describe("when next gen will put cell at edge of world", () => {});
});
