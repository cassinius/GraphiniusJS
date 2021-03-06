import * as $G from "@/core/base/BaseGraph";
import * as $BF from "@/traversal/BellmanFord";
import * as $N from "@/core/base/BaseNode";
import * as $JO from "@/traversal/Johnsons";
import * as $FW from "@/traversal/FloydWarshall";
import { JSONInput } from "@/io/input/JSONInput";
import { CSVInput, ICSVInConfig } from "@/io/input/CSVInput";
import { Logger } from "@/utils/Logger";

import { CSV_SN_PATH, JSON_DATA_PATH } from "_/config/test_paths";

const logger = new Logger();

const json = new JSONInput({ explicit_direction: true, directed: false, weighted: true }),
  search_graph = `${JSON_DATA_PATH}/search_graph_multiple_SPs.json`,
  bf_graph_file = `${JSON_DATA_PATH}/bellman_ford.json`,
  graph_search: $G.IGraph = json.readFromJSONFile(search_graph),
  graph_BF: $G.IGraph = json.readFromJSONFile(bf_graph_file);

/**
 *
 */
describe("Johnsons APSP TEST -", () => {
  let bf_graph_neg_cycle_file = `${JSON_DATA_PATH}/negative_cycle.json`,
    intermediate = `${JSON_DATA_PATH}/bernd_ares_intermediate_pos.json`;

  let graph_NC: $G.IGraph, graph_midsize: $G.IGraph;

  beforeEach(() => {
    graph_NC = json.readFromJSONFile(bf_graph_neg_cycle_file);
    graph_midsize = json.readFromJSONFile(intermediate);
  });

  test("Johnsons and FW should give the very same dists result", () => {
    // next results will be the same only if the FW next is transformed, see next unit below
    let resultJ = $JO.Johnsons(graph_search);
    logger.log("Johnsons results");
    logger.log(resultJ[0]);
    logger.log(resultJ[1]);

    let resultFW = $FW.FloydWarshallAPSP(graph_search);
    logger.log("FW results");
    logger.log(resultFW[0]);
    logger.log(resultFW[1]);
    expect(resultJ[0]).toEqual(resultFW[0]);
  });

  test("next result of FW could be transformed to the one the Johnsons gives", () => {
    //the order of algorithms does not make a difference here, but be careful with negative graphs!

    let resultFW = $FW.FloydWarshallAPSP(graph_search);
    logger.log("FW next before transformation :");
    logger.log(resultFW[1]);
    logger.log("the same, transformed: ");
    logger.log($FW.changeNextToDirectParents(resultFW[1]));

    let resultJ = $JO.Johnsons(graph_search);
    logger.log("Johnsons next: ");
    logger.log(resultJ[1]);
    expect(resultJ[1]).toEqual($FW.changeNextToDirectParents(resultFW[1]));
  });

  test("next result of FW on a negative-edge graph could be transformed to the one the Johnsons gives", () => {
    //caution: the Johnsons re-weighs the negative graphs!
    //if you run it on the graph without cloning or re-reading the graph, all following tests will be flawed
    let resultFWB = $FW.FloydWarshallAPSP(graph_BF);
    let graph_BF1 = graph_BF.cloneStructure();
    let resultJB = $JO.Johnsons(graph_BF1);
    // console.log("Johnsons next: ");
    // console.log(resultJB[1]);
    expect(resultJB[1]).toEqual($FW.changeNextToDirectParents(resultFWB[1]));
  });

  test("should refuse to compute Johnsons on empty graph", () => {
    let empty_graph = new $G.BaseGraph("iamempty");
    expect($JO.Johnsons.bind($JO.Johnsons, empty_graph)).toThrowError(
      "Cowardly refusing to traverse graph without edges."
    );
  });

  test("should correctly recognize graphs with/without negative edges", () => {
    expect(graph_search.hasNegativeEdge()).toBe(false);
    expect(graph_BF.hasNegativeEdge()).toBe(true);
    expect(graph_NC.hasNegativeEdge()).toBe(true);
  });

  test("should refuse to compute a graph with negative cycle", () => {
    let graph_BF2 = graph_BF.cloneStructure();
    expect($JO.Johnsons.bind($JO.Johnsons, graph_NC)).toThrowError(
      "The graph contains a negative cycle, thus it can not be processed"
    );
    expect($JO.Johnsons.bind($JO.Johnsons, graph_BF2)).not.toThrowError();
    expect($JO.Johnsons.bind($JO.Johnsons, graph_search)).not.toThrowError();
  });

  test("function addextraNandE should correctly add a node", () => {
    let extraNode: $N.BaseNode = new $N.BaseNode("extraNode");
    let graph_extra = graph_search.cloneStructure();
    graph_extra = $JO.addExtraNandE(graph_extra, extraNode);
    expect(graph_extra.nrNodes()).toEqual(graph_search.nrNodes() + 1);
  });

  test("function addextraNandE should correctly add n edges", () => {
    let extraNode: $N.BaseNode = new $N.BaseNode("extraNode");
    let graph_extra = graph_search.cloneStructure();
    graph_extra = $JO.addExtraNandE(graph_extra, extraNode);
    expect(graph_extra.nrDirEdges() + graph_extra.nrUndEdges()).toEqual(
      graph_search.nrDirEdges() + graph_search.nrUndEdges() + graph_search.nrNodes()
    );
  });

  test("function reweighGraph should function correctly", () => {
    expect(graph_BF.hasNegativeEdge()).toBe(true);
    let graph_BF3 = graph_BF.cloneStructure();
    let extraNode: $N.BaseNode = new $N.BaseNode("extraNode");
    graph_BF3 = $JO.addExtraNandE(graph_BF3, extraNode);
    let BFresult = $BF.BellmanFordDict(graph_BF3, extraNode);
    graph_BF3 = $JO.reWeighGraph(graph_BF3, BFresult.distances, extraNode);
    expect(graph_BF3.hasNegativeEdge()).toBe(false);
  });
});
