import { _decorator, resources, Node, Prefab } from "cc";
import { VirtualList } from "../VirtualList";
import BatchLoader from "../BatchLoader";
import { ListTestItemPool } from "./ListTestItemPool";
import { NestedHorList } from "./NestedHorList";

const { ccclass, property } = _decorator;

const DEFAULT_DATA_SOURCE = [
    ["《永遇乐·京口北固亭怀古》"],
    ["辛弃疾", "〔宋〕"],
    [
        "千古江山，",
        "英雄无觅，",
        "孙仲谋处。",
        "舞榭歌台，",
        "风流总被，",
        "雨打风吹去。",
        "斜阳草树，",
        "寻常巷陌，",
        "人道寄奴曾住。",
        "想当年，",
        "金戈铁马，",
        "气吞万里如虎。",
    ],
    [
        "元嘉草草，",
        "封狼居胥，",
        "赢得仓皇北顾。",
        "四十三年，",
        "望中犹记，",
        "烽火扬州路。",
        "可堪回首，",
        "佛狸祠下，",
        "一片神鸦社鼓。",
        "凭谁问：",
        "廉颇老矣，",
        "尚能饭否？",
    ],
    ["《江城子·密州出猎》"],
    ["苏轼", "〔宋〕"],
    ["老夫聊发少年狂，", "左牵黄，", "右擎苍，", "锦帽貂裘，", "千骑卷平冈。", "为报倾城随太守，", "亲射虎，", "看孙郎。"],
    ["酒酣胸胆尚开张。", "鬓微霜，", "又何妨！", "持节云中，", "何日遣冯唐？", "会挽雕弓如满月，", "西北望，", "射天狼。"],
];

@ccclass("NestedList")
export class NestedList extends VirtualList {
    protected start(): void {
        const queueLoader = new BatchLoader(2);
        queueLoader.add(this.onLoadComplete, this);
        queueLoader.processor = function (res: Prefab) {
            if (res) ListTestItemPool.inst.add(res);
        };
        resources.load("HItem", Prefab, queueLoader.itemLoader);
        resources.load("NItem", Prefab, queueLoader.itemLoader);
    }
    private onLoadComplete() {
        const exportName = this.node.name.toLowerCase();
        (<any>window)[exportName] = this;
        this.data = DEFAULT_DATA_SOURCE;
    }
    protected getItemSize(index: number): [number, number] {
        return [960, 100];
    }
    protected appendItem(index: number): Node {
        return ListTestItemPool.inst.acquire("NItem");
    }
    protected renderItem(item: Node, index: number): void {
        const data = this.getDataAt(index);
        if (data) {
            item.getComponentInChildren(NestedHorList).data = data.slice();
        }
    }
    protected recycleItem(item: Node): void {
        item.getComponentInChildren(NestedHorList).clear();
        ListTestItemPool.inst.recycle(item);
    }
}
