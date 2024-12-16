import { _decorator, Component } from "cc";
const { ccclass } = _decorator;

@ccclass("ItemRenderer")
export default abstract class ItemRenderer extends Component {
    onRender(index: number) {}
}
