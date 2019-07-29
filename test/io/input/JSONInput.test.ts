import * as fs from 'fs';
import * as $C from './common';
import * as $G from '../../../src/core/BaseGraph';
import { JSONInput, IJSONInConfig } from '../../../src/io/input/JSONInput';
import { abbs } from '../../../src/io/interfaces';
import { CSV_DATA_PATH, JSON_DATA_PATH } from '../../config/config';



let REAL_GRAPH_NR_NODES = 6204,
	REAL_GRAPH_NR_EDGES = 18550,
	small_graph 								= `${JSON_DATA_PATH}/small_graph.json`,
	small_graph_2N_flawed 			= `${JSON_DATA_PATH}/small_graph_2N_flawed.json`,
	small_graph_no_features 		= `${JSON_DATA_PATH}/small_graph_no_features.json`,
	small_graph_weights_crap 		= `${JSON_DATA_PATH}/small_graph_weights_crap.json`,
	real_graph 									= `${JSON_DATA_PATH}/real_graph.json`,
	extreme_weights_graph 			= `${JSON_DATA_PATH}/extreme_weights_graph.json`;

const DEFAULT_WEIGHT: number = 1;

const std_json_input_config: IJSONInConfig = {
	explicit_direction: true,
	directed: false,
	weighted: false
};


describe('GRAPH JSON INPUT TESTS', () => {

	let json: JSONInput,
		graph: $G.IGraph,
		stats: $G.GraphStats;

	describe('Basic instantiation tests - ', () => {

		test('should correctly instantiate a default version of JSONInput', () => {
			json = new JSONInput(std_json_input_config);
			expect(json).toBeInstanceOf(JSONInput);
			expect(json._config.explicit_direction).toBe(true);
			expect(json._config.directed).toBe(false);
			expect(json._config.weighted).toBe(false);
		});

	});


	describe('Small test graph', () => {

		test(
			'should correctly generate our small example graph out of a JSON file with explicitly encoded edge directions',
			() => {
				json = new JSONInput();
				graph = json.readFromJSONFile(small_graph);
				$C.checkSmallGraphStats(graph);
			}
		);


		test(
			'should correctly generate our small example graph out of a JSON file with direction _mode set to undirected',
			() => {
				json = new JSONInput();
				json._config.explicit_direction = false;
				json._config.directed = false;
				graph = json.readFromJSONFile(small_graph);
				expect(graph.nrNodes()).toBe(4);
				expect(graph.nrDirEdges()).toBe(0);
				expect(graph.nrUndEdges()).toBe(4);
			}
		);


		test(
			'should correctly generate our small example graph out of a JSON file with direction _mode set to directed',
			() => {
				json = new JSONInput();
				json._config.explicit_direction = false;
				json._config.directed = true;
				graph = json.readFromJSONFile(small_graph);
				expect(graph.nrNodes()).toBe(4);
				expect(graph.nrDirEdges()).toBe(7);
				expect(graph.nrUndEdges()).toBe(0);
			}
		);

	});


	describe('Real graph from JSON', () => {

		/**
		 * Edge list, but with a REAL graph now
		 * graph should have 5937 undirected nodes.
		 */
		test(
			'should construct a real sized graph from an edge list with edges set to undirected',
			() => {
				json = new JSONInput();
				graph = json.readFromJSONFile(real_graph);
				stats = graph.getStats();
				expect(stats.nr_nodes).toBe(REAL_GRAPH_NR_NODES);
				expect(stats.nr_dir_edges).toBe(0);
				expect(stats.nr_und_edges).toBe(REAL_GRAPH_NR_EDGES);
				expect(stats.mode).toBe($G.GraphMode.UNDIRECTED);
			}
		);


		/**
		 * Edge list, but with a REAL graph now
		 * graph should have 5937 directed nodes.
		 */
		test(
			'should construct a real sized graph from an edge list with edges set to directed',
			() => {
				json = new JSONInput();
				json._config.explicit_direction = false;
				json._config.directed = true;
				graph = json.readFromJSONFile(real_graph);
				stats = graph.getStats();
				expect(stats.nr_nodes).toBe(REAL_GRAPH_NR_NODES);
				expect(stats.nr_dir_edges).toBe(REAL_GRAPH_NR_EDGES);
				expect(stats.nr_und_edges).toBe(0);
				expect(stats.mode).toBe($G.GraphMode.DIRECTED);
			}
		);


		/**
		 * PERFORMANCE test case - see how long it takes to mutilate graph...
		 */
		test(
			'should mutilate a graph (delte nodes) until it is completely empty - in a performant way',
			() => {
				json = new JSONInput();
				json._config.explicit_direction = false;
				json._config.directed = false;
				graph = json.readFromJSONFile(real_graph);

				let nr_nodes = graph.nrNodes();
				while (nr_nodes--) {
					graph.deleteNode(graph.getNodeById(String(nr_nodes)));
				}
				expect(graph.nrNodes()).toBe(0);
				expect(graph.nrDirEdges()).toBe(0);
				expect(graph.nrUndEdges()).toBe(0);
			}
		);

	});


	/**
	 * Test for coordinates - take the 'small_graph.json'
	 * which contains x, y, z coords and check for their
	 * exact values upon instantiation (cloning?)
	 */
	describe('Node coordinates - ', () => {

		test(
			'should correctly read the node coordinates contained in a json file',
			() => {
				json = new JSONInput();
				json._config.explicit_direction = false;
				json._config.directed = false;
				graph = json.readFromJSONFile(small_graph);
				$C.checkSmallGraphCoords(graph);
			}
		);


		test(
			'should not assign the coords feature if no coordinates are contained in a json file',
			() => {
				json = new JSONInput();
				json._config.explicit_direction = false;
				json._config.directed = false;
				graph = json.readFromJSONFile(small_graph_no_features);
				let nodes = graph.getNodes();
				for (let node_idx in nodes) {
					expect(nodes[node_idx].getFeature(abbs.coords)).toBeUndefined();
				}
			}
		);

	});


	/**
   * Test for features - take the 'small_graph.json'
   * which contains some feature vectors and check for their
   * exact values upon instantiation (cloning?)
   */
	describe('Node features - ', () => {

		test(
			'should correctly read the node features contained in a json file',
			() => {
				json = new JSONInput();
				json._config.explicit_direction = false;
				json._config.directed = false;
				graph = json.readFromJSONFile(small_graph);
				$C.checkSmallGraphFeatures(graph);
			}
		);


		test(
			'should not assign any features if no features entry is contained in a json file',
			() => {
				json = new JSONInput();
				json._config.explicit_direction = false;
				json._config.directed = false;
				graph = json.readFromJSONFile(small_graph_no_features);
				let nodes = graph.getNodes();
				for (let node_idx in nodes) {
					expect( Object.keys( nodes[node_idx].getFeatures() ).length ).toBe(0);
				}
			}
		);

	});


	/**
	 * Test for weights - take the 'small_graph_weights.json'
	 * which contains weights for each edge and check for their
	 * exact (number) values upon instantiation
	 */
	describe('Edge weights - ', () => {

		beforeEach(() => {
			json = new JSONInput();
			json._config.explicit_direction = true;
		});


		test('should correctly read the edge weights contained in a json file', () => {
			json._config.weighted = true;
			graph = json.readFromJSONFile(small_graph);
			$C.checkSmallGraphEdgeWeights(graph);
		});


		test(
			'should correctly set edge weights to undefined if in unweighted _mode',
			() => {
				json._config.weighted = false;
				graph = json.readFromJSONFile(small_graph);
				let und_edges = graph.getUndEdges();
				for (let edge in und_edges) {
					expect(graph.getEdgeById(edge).isWeighted()).toBe(false);
					expect(graph.getEdgeById(edge).getWeight()).toBeUndefined();
				}
				let dir_edges = graph.getDirEdges();
				for (let edge in dir_edges) {
					expect(graph.getEdgeById(edge).isWeighted()).toBe(false);
					expect(graph.getEdgeById(edge).getWeight()).toBeUndefined();
				}
			}
		);


		test(
			'should correctly set edge weights to default of 1 if info contained in json file is crappy',
			() => {
				json._config.weighted = true;
				graph = json.readFromJSONFile(small_graph_weights_crap);
				let und_edges = graph.getUndEdges();
				for (let edge in und_edges) {
					expect(graph.getEdgeById(edge).isWeighted()).toBe(true);
					expect(graph.getEdgeById(edge).getWeight()).toBe(1);
				}
				let dir_edges = graph.getDirEdges();
				for (let edge in dir_edges) {
					expect(graph.getEdgeById(edge).isWeighted()).toBe(true);
					expect(graph.getEdgeById(edge).getWeight()).toBe(1);
				}
			}
		);


		describe('should be able to handle extreme edge weight cases', () => {

			beforeEach(() => {
				json._config.weighted = true;
				graph = json.readFromJSONFile(extreme_weights_graph);
			});


			test(
				'should correctly set edge weight of "undefined" to DEFAULT_WEIGHT of 1',
				() => {
					expect(graph.getEdgeById("A_A_d").getWeight()).toBe(DEFAULT_WEIGHT);
				}
			);


			test(
				'should correctly set edge weight of "Infinity" to Number.POSITIVE_INFINITY',
				() => {
					expect(graph.getEdgeById("A_B_d").getWeight()).toBe(Number.POSITIVE_INFINITY);
				}
			);


			test(
				'should correctly set edge weight of "-Infinity" to Number.NEGATIVE_INFINITY',
				() => {
					expect(graph.getEdgeById("A_C_d").getWeight()).toBe(Number.NEGATIVE_INFINITY);
				}
			);


			test('should correctly set edge weight of "MAX" to Number.MAX_VALUE', () => {
				expect(graph.getEdgeById("A_D_d").getWeight()).toBe(Number.MAX_VALUE);
			});


			test('should correctly set edge weight of "MIN" to Number.MIN_VALUE', () => {
				expect(graph.getEdgeById("A_E_d").getWeight()).toBe(Number.MIN_VALUE);
			});

		});

	});


	describe('FLAWED graphs - ', () => {

		test('should throw an Error if the JSON file contains duplicate undirected edges with different weights', () => {
			json = new JSONInput({explicit_direction: false, directed: false, weighted: true});
			let flawed_graph_duplicate_und_edge_diff_weights = JSON.parse(fs.readFileSync(small_graph_2N_flawed).toString());
			expect( json.readFromJSON.bind(json, flawed_graph_duplicate_und_edge_diff_weights) )
				.toThrow('Input JSON flawed! Found duplicate edge with different weights!');				
		});

	});

});
