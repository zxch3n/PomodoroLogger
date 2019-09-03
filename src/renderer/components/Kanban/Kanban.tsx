import React, { FunctionComponent, useEffect, useState, useRef } from 'react';
import { KanbanActionTypes } from './action';
import { KanbanState } from './reducer';
import { BoardActionTypes, KanbanBoard } from './Board/action';
import {
    Button,
    Select,
    Layout,
    Menu,
    Icon,
    Dropdown,
    Popconfirm,
    Form,
    Modal,
    Input,
    Radio
} from 'antd';
import shortid from 'shortid';
import Board from './Board';
import styled from 'styled-components';
import { SelectParam } from 'antd/lib/menu';
import TextArea from 'antd/es/input/TextArea';

const { Option } = Select;
const { Sider, Content } = Layout;

const Main = styled.div`
    background-color: #dedede;
`;

const CreateButton = styled.div`
    display: flex;
    justify-content: center;
    border: 1px dashed rgba(0, 0, 0, 0.2);
    border-radius: 6px;
    margin: 0 12px;
    padding: 4px;

    :hover {
        background-color: rgba(34, 45, 250, 0.1);
    }
`;

const MenuNameSpan = styled.span`
    float: left;
`;

const MenuIconSpan = styled.span`
    float: right;
`;

interface FormValue {
    name: string;
    description: string;
}

interface Props extends KanbanState, KanbanActionTypes, BoardActionTypes {}
export const Kanban: FunctionComponent<Props> = (props: Props) => {
    const ref = useRef<Form>();
    const [visible, setVisible] = useState(false);
    const [editingBoardId, setEditingBoardId] = useState<string | undefined>('');
    const valueHandler: (values: FormValue) => void = ({ name, description }: FormValue) => {
        console.log(name, description, editingBoardId);
        if (editingBoardId === undefined) {
            props.addBoard(shortid.generate(), name, description);
        } else {
            // Edit board
            props.editBoard(editingBoardId, name, description);
        }
    };
    const handleSave = () => {
        if (ref.current === undefined) {
            return;
        }

        const form: any = ref.current.props.form;
        form.validateFields((err: Error, values: any) => {
            if (err) {
                throw err;
            }

            valueHandler(values);
            form.resetFields();
            setVisible(false);
        });
    };
    const handleCancel = () => {
        setVisible(false);
    };
    useEffect(() => {
        props.fetchBoards();
    }, []);

    const addBoard = async () => {
        setEditingBoardId(undefined);
        setVisible(true);
        if (ref.current === undefined) {
            return;
        }

        const form: any = ref.current.props.form;
        form.setFieldsValue(
            {
                name: '',
                description: ''
            },
            (err: Error) => {
                if (err) throw err;
            }
        );
    };

    const overview = 'overview-default';
    const onSelect = async (param: SelectParam) => {
        if (param.key === overview) {
            await props.setChosenBoardId(undefined);
            return;
        }

        await props.setChosenBoardId(param.key);
    };

    const selectedKey = props.kanban.chosenBoardId || overview;
    const boardMenu = (board: KanbanBoard) => {
        const onDelete = () => {
            props.deleteBoard(board._id);
        };

        const onEdit = () => {
            setEditingBoardId(board._id);
            setVisible(true);
            if (ref.current === undefined) {
                return;
            }

            const form: any = ref.current.props.form;
            form.setFieldsValue(
                {
                    name: board.name,
                    description: board.description
                },
                (err: Error) => {
                    if (err) throw err;
                }
            );
        };

        const stopPropagation = (event: any) => {
            event.stopPropagation();
        };

        const menu = (
            <Menu onClick={stopPropagation}>
                <Menu.Item onClick={onEdit}>Edit</Menu.Item>
                <Menu.Item>
                    <Popconfirm title={'Are you sure?'} onConfirm={onDelete}>
                        Delete
                    </Popconfirm>
                </Menu.Item>
            </Menu>
        );

        return (
            <Menu.Item key={board._id}>
                <MenuNameSpan>{board.name}</MenuNameSpan>
                <MenuIconSpan>
                    <Dropdown overlay={menu}>
                        <Icon type={'menu'} />
                    </Dropdown>
                </MenuIconSpan>
            </Menu.Item>
        );
    };

    return (
        <Layout>
            <Sider
                theme="light"
                style={{ height: 'calc(100vh - 45px)' }}
                breakpoint="md"
                collapsedWidth="0"
            >
                <div className="logo" />
                <Menu theme="light" mode="inline" onSelect={onSelect} selectedKeys={[selectedKey]}>
                    <Menu.Item key={overview}>
                        <span>Overview</span>
                    </Menu.Item>
                    {Object.values(props.boards).map(boardMenu)}
                    <CreateButton>
                        <Button
                            icon="plus"
                            shape="circle-outline"
                            onClick={addBoard}
                            title={'Create A New Kanban'}
                        />
                    </CreateButton>
                </Menu>
            </Sider>
            <Content
                style={{
                    padding: 4,
                    height: 'calc(100vh - 45px)'
                }}
            >
                {props.kanban.chosenBoardId === undefined ? (
                    undefined
                ) : (
                    <Board boardId={props.kanban.chosenBoardId} key={props.kanban.chosenBoardId} />
                )}
            </Content>
            {
                // @ts-ignore
                <EditKanbanForm
                    wrappedComponentRef={ref}
                    visible={visible}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    isCreating={!editingBoardId}
                />
            }
        </Layout>
    );
};

interface FormProps {
    onSave?: any;
    onCancel?: any;
    form: any;
    visible: boolean;
    isCreating: boolean;
}

const EditKanbanForm = Form.create({ name: 'form_in_modal' })(
    class extends React.Component<FormProps> {
        render() {
            const { visible, onCancel, onSave, form, isCreating } = this.props;
            const { getFieldDecorator } = form;
            return (
                <Modal
                    visible={visible}
                    title={isCreating ? 'Create a new board' : 'Edit'}
                    okText={isCreating ? 'Create' : 'Save'}
                    onCancel={onCancel}
                    onOk={onSave}
                >
                    <Form layout="vertical">
                        <Form.Item label="Name">
                            {getFieldDecorator('name', {
                                rules: [
                                    { required: true, message: 'Please input the name of board!' }
                                ]
                            })(<Input />)}
                        </Form.Item>
                        <Form.Item label="Description">
                            {getFieldDecorator('description')(
                                <TextArea autosize={{ minRows: 3, maxRows: 5 }} />
                            )}
                        </Form.Item>
                    </Form>
                </Modal>
            );
        }
    }
);
