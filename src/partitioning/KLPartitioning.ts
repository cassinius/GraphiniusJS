import { IGraph } from '../core/Graph';
import { IBaseNode } from '../core/Nodes';
import { GraphPartitioning, Partition } from './Interfaces';
import { KCut } from './KCut';
import { BinaryHeap, BinaryHeapMode } from '../datastructs/binaryHeap';

import { Logger } from '../utils/logger';
const logger = new Logger();

const DEFAULT_WEIGHT = 1;


export type Gain = {id: string, source: IBaseNode, target: IBaseNode, gain: number};


interface KL_Costs {
  internal: {[key:string]: number};
  external: {[key:string]: number};
}


export interface KL_Config {
  initShuffle? : boolean;
  directed?    : boolean;
  weighted?    : boolean;
}


export class KLPartitioning {

  public _partitionings : Map<number, GraphPartitioning>;
  public _costs : KL_Costs;
  public _gainsHeap : BinaryHeap;
  
  public _bestPartitioning: number;
  public _currentPartitioning: number;

  public _adjList : {};
  // for faster iteration, as long as we're not using Maps
  private _keys : Array<string>;
  private _config : KL_Config;

  constructor(private _graph : IGraph, config? : KL_Config) {
    this._config = config || {
      initShuffle: false,
      directed: false,
      weighted: false
    }
    this._bestPartitioning = 1;
    this._currentPartitioning = 1;
    this._partitionings = new Map<number, GraphPartitioning>();
    
    this._costs = {
      internal: {},
      external: {},
    };

    this._adjList = this._graph.adjListDict();
    this._keys = Object.keys(this._graph.getNodes());

    this.initPartitioning(this._config.initShuffle);

    let nr_parts = this._partitionings.get(this._currentPartitioning).partitions.size;
    if ( nr_parts !== 2 ) {
      throw new Error(`KL partitioning works on 2 initial partitions only, got ${nr_parts}.`);
    }

    this.initCosts();
    this.initGainsHeap();
  }


  private initPartitioning(initShuffle) {
    logger.log(`Init Shuffle: ${initShuffle}`);

    if ( initShuffle ) {
      this._partitionings.set(this._currentPartitioning, new KCut(this._graph).cut(2, true));
    } else {
      let partitioning = {
        partitions: new Map<number, Partition>(),
        nodePartMap: new Map<string, number>(),
        cut_cost: 0
      };
      this._partitionings.set(this._currentPartitioning, partitioning);

      for (let key of this._keys) {
        let node = this._graph.getNodeById(key);        
        
        
        // assume we have a node feature 'partition'
        let node_part = node.getFeature('partition');
        if ( node_part == null ) {
          throw new Error('no node feature "partition" encountered - you need to set initShuffle to true');
        } else {
          partitioning.nodePartMap.set(key, node_part);
          if ( !partitioning.partitions.get(node_part) ) {
            partitioning.partitions.set(node_part, {
              nodes: new Map<string, IBaseNode>()
            });
          }
          partitioning.partitions.get(node_part).nodes.set(key, node);
        }
      }
    }
  }


  private initCosts() {
    let partitioning = this._partitionings.get(this._currentPartitioning),
        nodePartMap = partitioning.nodePartMap;

    for (let key of Object.keys(this._graph.getNodes())) {
      logger.write(key + ' : ');
      /**
       * @todo introduce weighted mode
       */
      Object.keys(this._adjList[key]).forEach( target => {
        logger.write(target);
        logger.write(`[${nodePartMap.get(key)}, ${nodePartMap.get(target)}]`);

        let edge_weight = this._config.weighted ? this._adjList[key][target] : DEFAULT_WEIGHT;

        if ( nodePartMap.get(key) === nodePartMap.get(target) ) {
          logger.write('\u2713' + ' ');
          if ( this._costs.internal[key] ) {
            this._costs.internal[key] += edge_weight;
          } else {
            this._costs.internal[key] = edge_weight;
          }
        } else {
          logger.write('\u2717' + ' ');
          if ( this._costs.external[key] ) {
            this._costs.external[key] += edge_weight;
          } else {
            this._costs.external[key] = edge_weight;
          }
          partitioning.cut_cost += edge_weight;
        }
      });
      logger.log('');
    }

    // we counted every edge twice in the nested loop above...
    partitioning.cut_cost /= 2;
  }


  initGainsHeap() {
    let partitioning = this._partitionings.get(this._currentPartitioning);
    let evalID = obj => obj.id;
    let evalPriority = obj => obj.gain;
    this._gainsHeap = new BinaryHeap( BinaryHeapMode.MAX, evalID, evalPriority );
    
    this._keys.forEach( source => {
      
    });
  }


  updateCosts() {

    // make a new partitioning for the next cycle / iteration
    this._currentPartitioning++;
  }


  doSwapAndDropLockedConnections() {
    
  }
}
