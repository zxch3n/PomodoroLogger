import React, { KeyboardEvent } from 'react';
import { Button, Form, Input, Modal, Popconfirm } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import Hotkeys from 'react-hot-keys';
import { DistractingListModalButton } from '../Setting/DistractingList';
import { TextAreaContainer } from './Kanban';
import { EditorContainer } from './style/editorStyle';
interface FormProps {
    boardId: string;
    onSave?: any;
    onCancel?: any;
    form: any;
    visible: boolean;
    isCreating: boolean;
    onDelete: () => void;
    nameValidator: (name: string) => boolean;
}

export const EditKanbanForm = Form.create<
    FormProps & {
        wrappedComponentRef: any;
    }
>({
    name: 'form_in_modal',
})(
    class extends React.Component<FormProps> {
        validator = (rule: any, name: string, callback: Function) => {
            if (!this.props.isCreating || this.props.nameValidator(name)) {
                callback();
                return;
            }
            callback(`Board "${name}" already exists`);
        };
        onKeyDown = (event: KeyboardEvent<any>) => {
            if (event.ctrlKey && !event.altKey && (event.keyCode === 13 || event.which === 13)) {
                this.props.onSave();
            }
        };
        render() {
            const { visible, onCancel, onSave, form, isCreating, onDelete, boardId } = this.props;
            const { getFieldDecorator } = form;
            return (
                <Modal
                    visible={visible}
                    title={isCreating ? 'Create a new board' : 'Edit'}
                    okText={isCreating ? 'Create' : 'Save'}
                    onCancel={onCancel}
                    onOk={onSave}
                    style={{ minWidth: 300 }}
                    width={'60vw'}
                >
                    <EditorContainer>
                        <Form layout="vertical">
                            <Hotkeys keyName={'ctrl+enter'} onKeyDown={onSave} />
                            <Form.Item label="Name">
                                {getFieldDecorator('name', {
                                    rules: [
                                        {
                                            required: true,
                                            message: 'Please input the name of board!',
                                        },
                                        { max: 48, message: 'Max length of name is 48' },
                                        { validator: this.validator },
                                    ],
                                })(<Input onKeyDown={this.onKeyDown} />)}
                            </Form.Item>
                            <Form.Item label="Description">
                                {getFieldDecorator('description')(
                                    <TextArea
                                        autosize={{ minRows: 3, maxRows: 5 }}
                                        onKeyDown={this.onKeyDown}
                                    />
                                )}
                            </Form.Item>
                            {!isCreating ? (
                                <>
                                    <Form.Item>
                                        <Popconfirm title={'Are you sure?'} onConfirm={onDelete}>
                                            <Button type={'danger'} icon={'delete'}>
                                                Delete
                                            </Button>
                                        </Popconfirm>
                                    </Form.Item>
                                    <DistractingListModalButton boardId={boardId} />
                                </>
                            ) : undefined}
                        </Form>
                    </EditorContainer>
                </Modal>
            );
        }
    }
);
