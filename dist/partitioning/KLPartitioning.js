"use strict";
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
var KCut_1 = require("./KCut");
var binaryHeap_1 = require("../datastructs/binaryHeap");
var logger_1 = require("../utils/logger");
var logger = new logger_1.Logger();
var DEFAULT_WEIGHT = 1;
var KLPartitioning = /** @class */ (function () {
    function KLPartitioning(_graph, config) {
        this._graph = _graph;
        this._config = config || {
            initShuffle: false,
            directed: false,
            weighted: false
        };
        this._bestPartitioning = 1;
        this._currentPartitioning = 1;
        this._partitionings = new Map();
        this._costs = {
            internal: {},
            external: {},
        };
        this._adjList = this._graph.adjListDict();
        this._keys = Object.keys(this._graph.getNodes());
        this.initPartitioning(this._config.initShuffle);
        var nr_parts = this._partitionings.get(this._currentPartitioning).partitions.size;
        if (nr_parts !== 2) {
            throw new Error("KL partitioning works on 2 initial partitions only, got " + nr_parts + ".");
        }
        this.initCosts();
        this.initGainsHeap();
    }
    KLPartitioning.prototype.initPartitioning = function (initShuffle) {
        var e_1, _a;
        logger.log("Init Shuffle: " + initShuffle);
        if (initShuffle) {
            this._partitionings.set(this._currentPartitioning, new KCut_1.KCut(this._graph).cut(2, true));
        }
        else {
            var partitioning = {
                partitions: new Map(),
                nodePartMap: new Map(),
                cut_cost: 0
            };
            this._partitionings.set(this._currentPartitioning, partitioning);
            try {
                for (var _b = __values(this._keys), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var key = _c.value;
                    var node = this._graph.getNodeById(key);
                    // assume we have a node feature 'partition'
                    var node_part = node.getFeature('partition');
                    if (node_part == null) {
                        throw new Error('no node feature "partition" encountered - you need to set initShuffle to true');
                    }
                    else {
                        partitioning.nodePartMap.set(key, node_part);
                        if (!partitioning.partitions.get(node_part)) {
                            partitioning.partitions.set(node_part, {
                                nodes: new Map()
                            });
                        }
                        partitioning.partitions.get(node_part).nodes.set(key, node);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
    };
    KLPartitioning.prototype.initCosts = function () {
        var _this = this;
        var e_2, _a;
        var partitioning = this._partitionings.get(this._currentPartitioning), nodePartMap = partitioning.nodePartMap;
        var _loop_1 = function (source) {
            logger.write(source + ' : ');
            // Initialize internal & external cost arrays
            this_1._costs.external[source] = 0;
            this_1._costs.internal[source] = 0;
            /**
             * @todo introduce weighted mode
             */
            Object.keys(this_1._adjList[source]).forEach(function (target) {
                logger.write(target);
                logger.write("[" + nodePartMap.get(source) + ", " + nodePartMap.get(target) + "]");
                /**
                 * @todo check for valid number, parse?
                 */
                var edge_weight = _this._config.weighted ? _this._adjList[source][target] : DEFAULT_WEIGHT;
                if (nodePartMap.get(source) === nodePartMap.get(target)) {
                    logger.write('\u2713' + ' ');
                    _this._costs.internal[source] += edge_weight;
                }
                else {
                    logger.write('\u2717' + ' ');
                    _this._costs.external[source] += edge_weight;
                    partitioning.cut_cost += edge_weight;
                }
            });
            logger.log('');
        };
        var this_1 = this;
        try {
            for (var _b = __values(Object.keys(this._graph.getNodes())), _c = _b.next(); !_c.done; _c = _b.next()) {
                var source = _c.value;
                _loop_1(source);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        // we counted every edge twice in the nested loop above...
        partitioning.cut_cost /= 2;
    };
    KLPartitioning.prototype.initGainsHeap = function () {
        var _this = this;
        var partitioning = this._partitionings.get(this._currentPartitioning), partition_iterator = partitioning.partitions.values(), first_partition = partition_iterator.next().value, second_partition = partition_iterator.next().value;
        var evalID = function (obj) { return obj.id; }, evalPriority = function (obj) { return obj.gain; };
        this._gainsHeap = new binaryHeap_1.BinaryHeap(binaryHeap_1.BinaryHeapMode.MAX, evalPriority, evalID);
        /**
         * We only calculate for node pairs in different partitions
         */
        first_partition.nodes.forEach(function (source) {
            var source_id = source.getID();
            logger.write(source.getID() + ': ');
            // Only get connected ones
            second_partition.nodes.forEach(function (target) {
                var target_id = target.getID();
                logger.write(target.getID() + ', ');
                var edge_weight = 0;
                var adj_weight = parseFloat(_this._adjList[source_id][target_id]);
                if (!isNaN(adj_weight)) {
                    edge_weight = _this._config.weighted ? adj_weight : DEFAULT_WEIGHT;
                }
                var pair_gain = _this._costs.external[source_id] - _this._costs.internal[source_id] + _this._costs.external[target_id] - _this._costs.internal[target_id] - 2 * edge_weight;
                var gain_entry = {
                    id: source_id + "_" + target_id,
                    source: source,
                    target: target,
                    gain: pair_gain
                };
                _this._gainsHeap.insert(gain_entry);
            });
            logger.log('');
        });
    };
    KLPartitioning.prototype.updateCosts = function () {
        // make a new partitioning for the next cycle / iteration
        this._currentPartitioning++;
    };
    KLPartitioning.prototype.doSwapAndDropLockedConnections = function () {
    };
    return KLPartitioning;
}());
exports.KLPartitioning = KLPartitioning;
