import { _decorator, Component, Node, EditBox, Label, Layout, UITransform, director, misc } from "cc";
import { TestVList } from "./TestVList";
const { ccclass, property } = _decorator;

/**
 * 虚拟列表测试示例
 * - 聊天列表
 */
@ccclass("ListTestcase")
export class ListTestcase extends Component {
    @property(TestVList)
    $list: TestVList = null;

    @property(EditBox)
    $editbox: EditBox = null;

    @property(Node)
    $vitem: Node = null;

    protected onEnable(): void {
        this.$editbox.node.on(EditBox.EventType.EDITING_RETURN, this.onSendMsg, this);
    }

    protected onDisable(): void {
        this.$editbox.node.off(EditBox.EventType.EDITING_RETURN, this.onSendMsg, this);
    }

    private onSendMsg() {
        const text = this.$editbox.string;
        if (text.length > 0) {
            this.$list.insertEnd(text);
        }
        this.$editbox.string = "";
        misc.callInNextTick(() => {
            this.$editbox.setFocus();
        });
    }
}
