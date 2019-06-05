import * as $G from '../../src/core/Graph';
import * as $N from '../../src/core/Nodes';
import * as $J from '../../src/io/input/JSONInput';
import * as $C from '../../src/io/input/CSVInput';
import * as $BF from '../../src/search/BellmanFord';

import { Logger } from '../../src/utils/logger';
const logger = new Logger();

let JSON_IN	= $J.JSONInput;
let CSV_IN	= $C.CSVInput;

let bf_graph_file = "./test/test_data/bellman_ford.json",
		bf_graph_neg_cycle_file = "./test/test_data/negative_cycle.json";


describe('GRAPH SEARCH Tests - Bellman Ford - ', () => {
	
	let json 							: $J.IJSONInput,
			csv								: $C.ICSVInput,
			bf_graph    			: $G.IGraph,
			bf_neg_cycle_graph: $G.IGraph,
      stats							: $G.GraphStats,
      BF                : Function = $BF.BellmanFordDict,
			BF_expect     		: {} = {},
			BF_neg_expect			: {} = {},
			BF_compute				: {} = {},
			BF_expect_array		: Array<number>,
			BF_compute_array	: any; // TODO refactor w.r.t union return type


	beforeAll(() => {
		json = new JSON_IN(true, false, true);
		csv = new CSV_IN(' ', false, false);
		bf_graph = json.readFromJSONFile(bf_graph_file);
		bf_neg_cycle_graph = json.readFromJSONFile(bf_graph_neg_cycle_file);
		BF_expect = { S: 0, A: 5, E: 8, C: 7, B: 5, D: 9 };
		BF_expect_array = [ 0, 5, 8, 7, 5, 9 ];
  });


	test('should correctly instantiate the test BF graph', () => {
		stats = bf_graph.getStats();
		expect(stats.nr_nodes).toBe(6);
		expect(stats.nr_dir_edges).toBe(8);
		expect(stats.nr_und_edges).toBe(0);
	});


	describe('Bellman Ford Sanity Checks Tests - ', () => {

		test('should reject an undefined or null graph', () => {
			expect($BF.BellmanFordDict.bind($BF.BellmanFordDict, undefined)).toThrowError('Graph as well as start node have to be valid objects.');
			expect($BF.BellmanFordDict.bind($BF.BellmanFordDict, null)).toThrowError('Graph as well as start node have to be valid objects.');
		});


		test('should reject an undefined or null start node', () => {
			let graph = new $G.BaseGraph('emptinius');
			expect($BF.BellmanFordDict.bind($BF.BellmanFordDict, graph, undefined)).toThrowError('Graph as well as start node have to be valid objects.');
			expect($BF.BellmanFordDict.bind($BF.BellmanFordDict, graph, null)).toThrowError('Graph as well as start node have to be valid objects.');
		});


		test('should refuse to search a graph without edges', () => {
			let graph = new $G.BaseGraph('emptinius');
			let node = graph.addNodeByID('firstus');
			expect($BF.BellmanFordDict.bind($BF.BellmanFordDict, graph, node)).toThrowError('Cowardly refusing to traverse a graph without edges.');
		});


		test('should reject an outside node', () => {
			let node = new $N.BaseNode('firstus');
			expect($BF.BellmanFordDict.bind($BF.BellmanFordDict, bf_graph, node)).toThrowError('Cannot start from an outside node.');
		});

	});


	/**
	 * TODO more test cases (directed, undirected, weighted, unweighted graphs)
	 */
	describe('BF Dict version tests - ', () => {
		
		test('should correctly compute distances from S within BF test graph', () => {
			BF_compute = $BF.BellmanFordDict(bf_graph, bf_graph.getNodeById("S")).distances;
			expect(BF_compute).toEqual(BF_expect);
		});

		/**
		 * Computing 'correct' distances with negative cycles makes no sense,
		 * since they are not even defined in finite time.
		 */

		test('BF should not detect any negative cycle in the bf graph', () => {
			expect($BF.BellmanFordDict(bf_graph, bf_graph.getNodeById("S")).neg_cycle).toBe(false);
		});


		test('BF should detect the negative cycle in the bf_neg_cycle graph', () => {
			expect($BF.BellmanFordDict(bf_neg_cycle_graph, bf_neg_cycle_graph.getNodeById("S")).neg_cycle).toBe(true);
		});

	});


	/**
	 * TODO more test cases (directed, undirected, weighted, unweighted graphs)
	 */
	describe('BF Array version tests - ', () => {

		test('should correctly compute dists for BF test graph', () => {
			BF_compute_array = $BF.BellmanFordArray(bf_graph, bf_graph.getNodeById("S")).distances;
			expect(BF_compute_array).toEqual(BF_expect_array);
		});


		test('BF should not detect any negative cycle in the bf graph', () => {
			expect($BF.BellmanFordArray(bf_graph, bf_graph.getNodeById("S")).neg_cycle).toBe(false);
		});


		test('BF should detect the negative cycle in the bf_neg_cycle graph', () => {
			expect($BF.BellmanFordArray(bf_neg_cycle_graph, bf_neg_cycle_graph.getNodeById("S")).neg_cycle).toBe(true);
		});

	});


	/**
	 * @todo abstract out to performance test suite
	 */
	describe('Performance Tests - ', () => {

		let social_300_file = "./test/test_data/social_network_edges_300.csv",
				social_1k_file = "./test/test_data/social_network_edges_1K.csv",
				social_20k_file = "./test/test_data/social_network_edges_20K.csv",
				sn_300_graph  		: $G.IGraph,
				sn_1k_graph				: $G.IGraph,
				sn_20k_graph 			: $G.IGraph;


		/**
		 * For some reason, the beforeAll block is not executed before the forEach block
		 * -> probably some quirk with jest & asynchronous tests...
		 */
		// beforeAll(() => {
			csv = new CSV_IN(' ', false, false);
			sn_300_graph = csv.readFromEdgeListFile(social_300_file);
			sn_1k_graph = csv.readFromEdgeListFile(social_1k_file);
			sn_20k_graph = csv.readFromEdgeListFile(social_20k_file);

			// logger.log(`Social network graph with ${sn_300_graph.nrNodes()} nodes: ${sn_300_graph}`);
		// });

		[sn_300_graph].forEach( sn_graph => { // , sn_1k_graph , sn_20k_graph
			test(`BF performance test on social networks of realistic (client-side) size:` , () => {
				let tic = +new Date();
				BF_compute = $BF.BellmanFordDict(sn_graph, sn_graph.getRandomNode());
				let toc = +new Date();
				logger.log("BellmanFord on social network of ~300 nodes took " + (toc-tic) + " ms. to finish");
				tic = +new Date();
				BF_compute = $BF.BellmanFordArray(sn_graph, sn_graph.getRandomNode());
				toc = +new Date();
				logger.log("BellmanFord (Array) on social network of ~300 nodes took " + (toc-tic) + " ms. to finish");
			});
		});

	});
  
});