import * as fs from 'fs';
import * as path from 'path';
import {ITypedEdge, TypedEdge} from "../../../src/core/typed/TypedEdge";
import {BaseNode} from "../../../src/core/base/BaseNode";
import {DIR} from '../../../src/core/base/BaseGraph';
import {ITypedNode, TypedNode} from "../../../src/core/typed/TypedNode";
import {TypedGraph} from '../../../src/core/typed/TypedGraph';
import {JSONInput, IJSONInConfig} from '../../../src/io/input/JSONInput';
import {JSON_REC_PATH, JSON_TYPE_PATH} from '../../config/config';
import {GENERIC_TYPES} from "../../../src/config/run_config";

import {Logger} from '../../../src/utils/Logger';
const logger = new Logger();

const jobsGraphFile = path.join(__dirname, '../../../data/json/recommender/jobs.json');


/**
 * @description dont use graph.addNodeByID since this just calls the
 *              parent class which omits the node type !
 */
describe('TYPED GRAPH TESTS: ', () => {
	let graph: TypedGraph;


	beforeEach(() => {
		graph = new TypedGraph("testus");
	});


	describe('Basic instantiation - ', () => {

		it('should construct a typed graph with a pre-set "generic" NODE type', () => {
			expect(graph.nodeTypes().length).toBe(1);
			expect(graph.nodeTypes()).toContain(GENERIC_TYPES.Node);
		});


		it('should construct a typed graph with a pre-set "generic" EDGE type', () => {
			expect(graph.edgeTypes().length).toBe(1);
			expect(graph.edgeTypes()).toContain(GENERIC_TYPES.Node);
		});


		it('should report TypedGraph to be typed', function () {
			expect(graph.type).toBe(GENERIC_TYPES.Graph);
		});

	});


	describe('Nodes - ', () => {

		const nodeType = 'PERSON',
			nodeTypeLower = 'person';


		it('receives a TypedNode from graph.getNodeByID', () => {
			let a = graph.addNodeByID('A');
			expect(BaseNode.isTyped(a)).toBe(true);
			expect(BaseNode.isTyped(graph.getNodeById('A'))).toBe(true);
		});


		it('should correctly register a node type `PERSON`', () => {
			expect(graph.nrNodes()).toBe(0);
			expect(graph.nrTypedNodes(nodeType)).toBeNull;
			graph.addNode(new TypedNode("A", {type: nodeType}));
			/* First check for nrNodes in BaseGraph */
			expect(graph.nrNodes()).toBe(1);
			/* Now check TypedGraph */
			expect(graph.nodeTypes().length).toBe(2);
			expect(graph.nodeTypes()).toContain(nodeType);
			expect(graph.nrTypedNodes(nodeType)).toBe(1);
		});


		it('should register a node type in UPPERCASE', () => {
			graph.addNode(new TypedNode("A", {type: nodeTypeLower}));
			expect(graph.nodeTypes()).not.toContain(nodeTypeLower);
			expect(graph.nodeTypes()).toContain(nodeTypeLower.toUpperCase());
		});


		it('should check for node type existence in UPPERCASE', () => {
			graph.addNode(new TypedNode("A", {type: nodeTypeLower}));
			expect(graph.nrTypedNodes(nodeTypeLower)).toBe(1);
		});


		it('should delete a node instance but still keep a non-empty set of types', () => {
			['A', 'B'].forEach(id => graph.addNode(new TypedNode(id, {type: nodeType})));
			expect(graph.nrNodes()).toBe(2);
			expect(graph.nrTypedNodes(nodeType)).toBe(2);
			graph.deleteNode(graph.getNodeById('A') as TypedNode);
			expect(graph.nrNodes()).toBe(1);
			expect(graph.nrTypedNodes(nodeType)).toBe(1);
		});


		it('should un-register a node type upon deletion of its last instance', () => {
			graph.addNode(new TypedNode("A", {type: nodeType}));
			expect(graph.nodeTypes()).toContain(nodeType);
			graph.deleteNode(graph.getNodeById('A') as TypedNode);
			expect(graph.nrNodes()).toBe(0);
			expect(graph.nodeTypes()).not.toContain(nodeType);
			expect(graph.nrTypedNodes(nodeType)).toBe(null);
		});


		it('should add a TypedNode by ID', () => {
			expect(graph.nodeTypes()).not.toContain(nodeType);
			expect(graph.nrTypedNodes(nodeType)).toBe(null);
			graph.addNodeByID("A", {type: nodeType});
			expect(graph.nodeTypes()).toContain(nodeType);
			expect(graph.nrTypedNodes(nodeType)).toBe(1);
		});


		it('should get nodes of type Person', () => {
			graph.addNode(new TypedNode("A", {type: nodeType}));
			graph.addNode(new TypedNode("B", {type: nodeType}));
			expect(graph.getNodesT('Generic')).toBeNull;
			expect(graph.getNodesT('Person').size).toBe(2);
		});


		it('should get edges of type Likes', () => {
			graph.addNode(new TypedNode("A", {type: nodeType}));
			graph.addNode(new TypedNode("B", {type: nodeType}));
			graph.addEdgeByNodeIDs('l1', 'A', 'B', {directed: true, type: 'Likes'});
			expect(graph.getEdgesT('Hates')).toBeNull;
			expect(graph.getEdgesT('Likes').size).toBe(1);
		});


	});


	describe('Edges - ', () => {

		const nodeType = 'PERSON',
			edgeType = 'FRIENDS_WITH',
			edgeTypeLower = 'friends_with',
			edgeID = 'a_b_friends';

		let graph: TypedGraph,
			a: ITypedNode,
			b: ITypedNode;


		beforeEach(() => {
			graph = new TypedGraph("testus");
			a = graph.addNode(new TypedNode('A', {type: nodeType}));
			b = graph.addNode(new TypedNode('B', {type: nodeType}));
		});


		it('should correctly register an edge type `FRIENDS_WITH`', () => {
			expect(graph.nrUndEdges()).toBe(0);
			expect(graph.nrTypedEdges("Person")).toBeNull();
			graph.addEdge(new TypedEdge(edgeID, a, b, {type: edgeType}));
			/* First check for nrUndEdges in BaseGraph */
			expect(graph.nrUndEdges()).toBe(1);
			/* Now check TypedGraph */
			expect(graph.edgeTypes().length).toBe(2);
			expect(graph.edgeTypes()).toContain(edgeType);
			expect(graph.nrTypedEdges(edgeType)).toBe(1);
		});


		it('should register an edge type in UPPERCASE', () => {
			expect(graph.nrTypedNodes(nodeType)).toBe(2);
			graph.addEdge(new TypedEdge(edgeID, a, b, {type: edgeTypeLower}));
			expect(graph.edgeTypes()).not.toContain(edgeTypeLower);
			expect(graph.edgeTypes()).toContain(edgeTypeLower.toUpperCase());
		});


		it('should check for edge type existence in UPPERCASE', () => {
			graph.addEdge(new TypedEdge(edgeID, a, b, {type: edgeTypeLower}));
			expect(graph.nrTypedEdges(edgeTypeLower)).toBe(1);
		});


		it('should delete an edge instance but still keep a non-empty set of types', () => {
			graph.addEdge(new TypedEdge(edgeID, a, b, {type: edgeType}));
			graph.addEdge(new TypedEdge(edgeID + "2", a, b, {type: edgeType}));
			graph.deleteEdge(graph.getEdgeById(edgeID) as TypedEdge);
			expect(graph.nrTypedEdges(edgeType)).toBe(1);
		});


		it('should un-register an edge type upon deletion of its last instance', () => {
			graph.addEdge(new TypedEdge(edgeID, a, b, {type: edgeType}));
			graph.deleteEdge(graph.getEdgeById(edgeID) as TypedEdge);
			expect(graph.edgeTypes()).not.toContain(edgeType);
			expect(graph.nrTypedEdges(edgeType)).toBe(null);
		});


		const
			edgeType1 = 'FRIENDS_WITH',
			edgeType2 = 'CO_AUTHORS';


		it('should produce the correct graphStats', () => {
			graph.addEdge(new TypedEdge('1', a, b, {directed: true, type: edgeType1}));
			graph.addEdge(new TypedEdge('2', b, a, {directed: true, type: edgeType2}));

			// logger.log(JSON.stringify(graph.stats));

			expect(graph.stats).toEqual({
				mode: 1,
				nr_nodes: 2,
				nr_und_edges: 0,
				nr_dir_edges: 2,
				density_dir: 1,
				density_und: 0,
				typed_nodes: {
					[GENERIC_TYPES.Node]: 0,
					[nodeType]: 2
				},
				typed_edges: {
					[GENERIC_TYPES.Edge]: 0,
					[edgeType1]: 1,
					[edgeType2]: 1
				}
			});
		});


		describe('real-world graph (beer example)', () => {

			beforeEach(() => {
				graph = new TypedGraph('Bier her!');
			});


			it('should read beerGraph from neo4j example and give the correct stats', () => {
				const controlStats = {
					mode: 1,
					nr_nodes: 577,
					nr_und_edges: 0,
					nr_dir_edges: 870,
					density_dir: 0.0026177065280184866,
					density_und: 0,
					typed_nodes: {
						GENERIC: 0,
						BEER: 292,
						BREWERY: 49,
						CATEGORY: 11,
						CITY: 47,
						STATE: 26,
						COUNTRY: 11,
						STYLE: 141
					},
					typed_edges: {
						GENERIC: 0,
						BREWED_AT: 292,
						BEER_CATEGORY: 231,
						BEER_STYLE: 231,
						LOC_CITY: 49,
						LOC_STATE: 41,
						LOC_COUNTRY: 26
					}
				};
				const graphFile = JSON_REC_PATH + '/beerGraph.json';

				const tic = +new Date;
				graph = new JSONInput({dupeCheck: false}).readFromJSONFile(graphFile, graph) as TypedGraph;
				const toc = +new Date;

				// logger.log(`Reading in TypedGraph from Neo4j beer example took: ${toc - tic} ms.`);
				// logger.log(graph.stats);
				expect(graph.stats).toEqual(controlStats);
			});

		});

	});


	/**
	 * @todo construct graph with second node type & check this as well
	 *       - most popular person vs. most popular coffee...
	 */
	describe('Typed graph node neighborhood tests - ', () => {

		enum NODE_TYPES {
			Person = 'PERSON',
			Coffee = 'COFFEE'
		}

		enum EDGE_TYPES {
			Likes = 'LIKES',
			Hates = 'HATES',
			Drinks = 'DRINKS',
			Coworker = 'COWORKER'
		}

		const
			json = new JSONInput(),
			g: TypedGraph = json.readFromJSONFile(JSON_TYPE_PATH + '/office.json', new TypedGraph('office graph')) as TypedGraph;


		it('should correctly compute the friends of A', () => {
			const friends = g.ins(g.n('A'), EDGE_TYPES.Likes);
			expect(friends.size).toBe(1);
			expect(Array.from(friends).map(e => e.id)).toEqual(['B']);
		});


		it('should correctly compute the enemies of C', () => {
			const enemies = g.outs(g.n('C'), EDGE_TYPES.Hates);
			expect(enemies.size).toBe(2);
			expect(Array.from(enemies).map(e => e.id)).toEqual(['A', 'D']);
		});


		it('should correctly compute the coworkers of D', () => {
			const cowies = g.conns(g.n('D'), EDGE_TYPES.Coworker);
			expect(cowies.size).toBe(2);
			expect(Array.from(cowies).map(c => c.id)).toEqual(['A', 'F']);
		});

	});


	/**
	 * @todo construct graph with second node type & check this as well
	 *       - most popular person vs. most popular coffee...
	 */
	describe('Typed graph `histogram` tests & least/most/k-l/m popular/degree - ', () => {

		enum NODE_TYPES {
			Person = 'PERSON',
			Coffee = 'COFFEE'
		}

		enum EDGE_TYPES {
			Likes = 'LIKES',
			Hates = 'HATES',
			Drinks = 'DRINKS',
			Coworker = 'COWORKER'
		}

		const
			json = new JSONInput(),
			g: TypedGraph = json.readFromJSONFile(JSON_TYPE_PATH + '/office.json', new TypedGraph('office graph')) as TypedGraph;


		it('should correctly compute the IN histogram of likes', () => {
			expect(g.inHistT(NODE_TYPES.Person, EDGE_TYPES.Likes)).toEqual([
				new Set([g.n('E'), g.n('F'), g.n('G')]),
				new Set([g.n('A'), g.n('B'), g.n('C'), g.n('D')])
			]);
		});


		it('should correctly compute the OUT histogram of likes', () => {
			expect(g.outHistT(NODE_TYPES.Person, EDGE_TYPES.Likes)).toEqual([
				new Set([g.n('C'), g.n('D'), g.n('E'), g.n('G')]),
				new Set([g.n('B'), g.n('F')]),
				new Set([g.n('A')]),
			]);
		});


		it('should correctly compute the CONN histogram of likes', () => {
			expect(g.connHistT(NODE_TYPES.Person, EDGE_TYPES.Likes)).toEqual([
				new Set([g.n('A'), g.n('B'), g.n('C'), g.n('D'), g.n('E'), g.n('F'), g.n('G')])
			]);
		});


		it('should correctly compute the IN histogram of hates', () => {
			expect(g.inHistT(NODE_TYPES.Person, EDGE_TYPES.Hates)).toEqual([
				new Set([g.n('B'), g.n('C'), g.n('F'), g.n('G')]),
				new Set([g.n('A')]),
				new Set([g.n('D'), g.n('E')])
			]);
		});


		it('should correctly compute the OUT histogram of hates', () => {
			expect(g.outHistT(NODE_TYPES.Person, EDGE_TYPES.Hates)).toEqual([
				new Set([g.n('A'), g.n('F'), g.n('G')]),
				new Set([g.n('B'), g.n('D'), g.n('E')]),
				new Set([g.n('C')])
			]);
		});


		it('should correctly compute the CONN histogram of hates', () => {
			expect(g.connHistT(NODE_TYPES.Person, EDGE_TYPES.Hates)).toEqual([
				new Set([g.n('A'), g.n('B'), g.n('C'), g.n('D'), g.n('E'), g.n('F'), g.n('G')])
			]);
		});


		it('should correctly compute the IN histogram of coworkers', () => {
			expect(g.inHistT(NODE_TYPES.Person, EDGE_TYPES.Coworker)).toEqual([
				new Set([g.n('A'), g.n('B'), g.n('C'), g.n('D'), g.n('E'), g.n('F'), g.n('G')])
			]);
		});


		it('should correctly compute the OUT histogram of coworkers', () => {
			expect(g.outHistT(NODE_TYPES.Person, EDGE_TYPES.Coworker)).toEqual([
				new Set([g.n('A'), g.n('B'), g.n('C'), g.n('D'), g.n('E'), g.n('F'), g.n('G')])
			]);
		});


		it('should correctly compute the CONN histogram of coworkers', () => {
			expect(g.connHistT(NODE_TYPES.Person, EDGE_TYPES.Coworker)).toEqual([
				new Set([g.n('C'), g.n('E'), g.n('G')]),
				new Set([g.n('B'), g.n('F')]),
				new Set([g.n('A'), g.n('D')])
			]);
		});


		it('should find the most liking / trusting person', () => {
			const likingHist = g.outHistT(NODE_TYPES.Person, EDGE_TYPES.Likes);
			expect(likingHist[likingHist.length - 1]).toEqual(new Set([g.n('A')]));
		});


		it('should find the most hateful person', () => {
			const hatingHist = g.outHistT(NODE_TYPES.Person, EDGE_TYPES.Hates);
			expect(hatingHist[hatingHist.length - 1]).toEqual(new Set([g.n('C')]));
		});


		/**
		 * @todo try this with `sparse` array (and position 42...)
		 */
		it('should find people with at least two coworkers', () => {
			const k_least = 2;
			const coworkHist = g.connHistT(NODE_TYPES.Person, EDGE_TYPES.Coworker);
			const idxs = Object.keys(coworkHist);
			// logger.log(idxs[k_least]);
			expect(coworkHist[idxs[k_least]]).toEqual(new Set([g.n('A'), g.n('D')]));
		});

	});


	/**
	 * Using JobSkill sample graph
	 *
	 * @description since we have no fulltext search in Graphinius itself,
	 * 							and we're not using names as IDs, we manually looked up:
	 * 							- Marie Pfeffer -> ID 40
	 * 						  - Tom Lemke -> ID 20
	 */
	describe.only('(sub)set expansion tests - ', () => {

		const knows = 'KNOWS';
		let
			g: TypedGraph;

		beforeAll(() => {
			g = new TypedGraph('jobs / skills sample');
			g = new JSONInput().readFromJSONFile(jobsGraphFile, g) as TypedGraph;
			expect(g.stats.mode).toBe(1);
			expect(g.stats.nr_nodes).toBe(305);
			expect(g.stats.nr_und_edges).toBe(0);
			expect(g.stats.nr_dir_edges).toBe(7628);
			expect(g.n('20').getFeature('name')).toBe('Tom Lemke');
			expect(g.n('40').getFeature('name')).toBe('Marie Pfeffer');
		});

		/**
		 * Marie Pfeffer -> known by 11 people
		 */
		it('should expand a single node (IN) when passed as Set', () => {
			expect(g.getNeighborsOfSet(new Set([g.n('40')]), DIR.in, knows).size).toBe(11);
		});

		/**
		 * Marie Pfeffer & Tom Lemke -> together known by 25 people
		 */
		it('should expand a node SET (IN)', () => {
			const expanse = g.getNeighborsOfSet(new Set([g.n('40'), g.n('20')]), DIR.in, knows);
			// console.log(expanse);
			expect(expanse.size).toBe(25);
		});

		/**
		 * Marie Pfeffer -> knows 17 people
		 */
		it('should expand a single node (OUT) when passed as Set', () => {
			expect(g.getNeighborsOfSet(new Set([g.n('40')]), DIR.out, knows).size).toBe(17);
		});

		/**
		 * Marie Pfeffer & Tom Lemke -> together know 32 people
		 */
		it('should expand a node SET (OUT)', () => {
			expect(g.getNeighborsOfSet(new Set([g.n('40'), g.n('20')]), DIR.out, knows).size).toBe(32);
		});


		it('should not expand a negative number of steps', () => {
			expect(() => g.expandK(new Set([g.n('40'), g.n('20')]), DIR.out, knows, -1))
				.toThrowError('cowardly refusing to expand a negative number of steps.');
		});

		/**
		 * Marie Pfeffer -> knows 17 people
		 */
		it('should expand K steps from a single node (OUT) when passed as Set', () => {
			expect(g.expandK(new Set([g.n('40')]), DIR.out, knows, 1).size).toBe(17);
		});

		/**
		 * Marie Pfeffer & Tom Lemke -> together know 32 people
		 */
		it('should expand K steps from a node SET (OUT)', () => {
			expect(g.expandK(new Set([g.n('40'), g.n('20')]), DIR.out, knows, 1).size).toBe(32);
		});

		/**
		 * Marie Pfeffer -> 2 steps OUT -> 157 people
		 */
		it('should expand K steps from a single node (OUT) when passed as Set', () => {
			const expanse = g.expandK(new Set([g.n('40')]), DIR.out, knows, 2);
			const names = [...expanse.values()].map(n => n.getFeature('name')).sort();
			// fs.writeFileSync('./data/output/marie_pfeffer_names.csv', names.join('\n'));
			const compareNames = fs.readFileSync('./data/results/marie_2_expand.csv').toString().trim().split('\n');
			expect(expanse.size).toBe(161);
			expect(names).toEqual(compareNames);
		});

		/**
		 * Marie Pfeffer -> 3 steps OUT -> 200 people (max)
		 */
		it('should expand K steps from a single node (OUT) when passed as Set', () => {
			const tic = process.hrtime()[1];
			const expanse = g.expandK(new Set([g.n('40')]), DIR.out, knows, 3);
			const toc = process.hrtime()[1];
			console.log(`Expanding people to the max ;-) took ${toc-tic} nanos.`);
			expect(expanse.size).toBe(200);
		});

		/**
		 * Marie Pfeffer -> 2 steps IN -> 122 people
		 */
		it('should expand K steps from a single node (IN) when passed as Set', () => {
			const expanse = g.expandK(new Set([g.n('40')]), DIR.in, knows, 2);
			expect(expanse.size).toBe(122);
		});

		/**
		 * Marie Pfeffer -> 3 steps OUT -> 200 people (max)
		 */
		it('should expand K steps from a single node (IN) when passed as Set', () => {
			const tic = process.hrtime()[1];
			const expanse = g.expandK(new Set([g.n('40')]), DIR.in, knows, 3);
			const toc = process.hrtime()[1];
			console.log(`Expanding people to the max ;-) took ${toc-tic} nanos.`);
			expect(expanse.size).toBe(200);
		});

		// /**
		//  * Marie Pfeffer & Tom Lemke -> 2 steps OUT -> 165 people
		//  */
		// it('should expand K steps from a Set OUT', () => {
		// 	const tic = process.hrtime()[1];
		// 	const expanse = g.expandK(new Set([g.n('40'), g.n('20')]), DIR.out, knows, 2);
		// 	const toc = process.hrtime()[1];
		// 	console.log(`Expanding 2 people OUT took ${toc-tic} nanos.`);
		// 	expect(expanse.size).toBe(165);
		// });




	});

});
