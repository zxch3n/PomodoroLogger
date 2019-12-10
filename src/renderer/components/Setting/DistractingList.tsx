import * as React from 'react';
import { DistractingRow, actions } from '../Timer/action';
import { actions as boardActions } from '../Kanban/Board/action';
import { connect } from 'react-redux';
import { RootState } from '../../reducers';
import { Dispatch } from 'redux';
import { Form, Input, Icon, Button, Modal } from 'antd';
import { FormComponentProps } from 'antd/es/form/Form';
import styled from 'styled-components';

const Container = styled.div`
    max-height: calc(100vh - 300px);
    overflow-y: auto;
    ::-webkit-scrollbar {
        width: 4px;
        height: 4px;
        background-color: rgba(0, 0, 0, 0);
    }
    ::-webkit-scrollbar-track {
        width: 4px;
        background-color: rgba(0, 0, 0, 0);
    }
    ::-webkit-scrollbar-thumb {
        width: 4px;
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
    }
`;

class DynamicFieldSet extends React.Component<
    FormComponentProps & { onSubmit: (ans: any) => void }
> {
    private id = 0;
    remove = (k: number) => {
        const { form } = this.props;
        // can use data-binding to get
        const keys = form.getFieldValue('keys');
        // We need at least one passenger
        if (keys.length === 1) {
            return;
        }

        // can use data-binding to set
        form.setFieldsValue({
            keys: keys.filter((key: number) => key !== k)
        });
    };

    add = () => {
        const { form } = this.props;
        // can use data-binding to get
        const keys = form.getFieldValue('keys');
        const nextKeys = keys.concat(this.id);
        this.id += 1;
        // can use data-binding to set
        // important! notify form to detect changes
        form.setFieldsValue({
            keys: nextKeys
        });
    };

    setValues = (apps: (string | undefined)[], titles: (string | undefined)[]) => {
        if (apps.length === 0) {
            return;
        }

        const keys = apps.map((v, i) => i);
        this.id = Math.max(...keys) + 1;
        this.props.form.setFieldsValue(
            {
                keys
            },
            console.error
        );
        this.render();
        this.props.form.setFieldsValue(
            {
                apps,
                titles
            },
            console.error
        );
    };

    handleSubmit = (e?: any) => {
        if (e) {
            e.preventDefault();
        }

        this.props.form.validateFields((err: Error, values: any) => {
            if (!err) {
                // tslint:disable-next-line:prefer-const
                let { keys, apps, titles } = values;
                keys = keys.filter((v: any, i: any) => apps[i] || titles[i]);
                this.props.form.setFieldsValue(
                    {
                        keys
                    },
                    console.error
                );

                const ans = [];
                for (const key of keys) {
                    ans.push({
                        app: apps[key],
                        title: titles[key]
                    });
                }

                this.props.onSubmit(ans);
            }
        });
    };

    render() {
        const { getFieldDecorator, getFieldValue } = this.props.form;
        const formItemLayout = {
            labelCol: {
                xs: { span: 24 },
                sm: { span: 4 }
            },
            wrapperCol: {
                xs: { span: 24 },
                sm: { span: 20 }
            }
        };
        const formItemLayoutWithOutLabel = {
            wrapperCol: {
                xs: { span: 24, offset: 0 },
                sm: { span: 20, offset: 4 }
            }
        };

        getFieldDecorator('keys', { initialValue: [] });
        const keys = getFieldValue('keys');
        const formItems = keys.map((k: number, index: number) => (
            <Form.Item
                {...(index === 0 ? formItemLayout : formItemLayoutWithOutLabel)}
                label={index === 0 ? 'RegExp' : ''}
                required={false}
                key={k}
            >
                {getFieldDecorator(`apps[${k}]`, {})(
                    <Input
                        placeholder="App RegExp"
                        style={{ width: '85%', marginRight: 8 }}
                        addonBefore={'App'}
                    />
                )}
                {getFieldDecorator(`titles[${k}]`, {})(
                    <Input
                        placeholder="Title RegExp"
                        style={{ width: '85%', marginRight: 8 }}
                        addonBefore={'Title'}
                    />
                )}

                {keys.length > 1 ? (
                    <Icon
                        className="dynamic-delete-button"
                        type="minus-circle-o"
                        /* tslint:disable-next-line:jsx-no-lambda */
                        onClick={() => this.remove(k)}
                    />
                ) : null}
            </Form.Item>
        ));
        return (
            <Form onSubmit={this.handleSubmit}>
                {formItems}
                <Form.Item {...formItemLayoutWithOutLabel}>
                    <Button type="dashed" onClick={this.add} style={{ width: '85%' }}>
                        <Icon type="plus" /> Add field
                    </Button>
                </Form.Item>
            </Form>
        );
    }
}

const WrappedDynamicFieldSet = Form.create({ name: 'dynamic_form_item' })(DynamicFieldSet);

interface InputProps {
    boardId?: string;
}

interface Props extends InputProps {
    distractingList: DistractingRow[];
    setDistractingList: (rows: DistractingRow[]) => void;
}

class PrivateDistractingList extends React.Component<Props> {
    ref = React.createRef<DynamicFieldSet>();
    constructor(props: Props) {
        super(props);
    }

    componentDidMount(): void {
        if (!this.ref.current) {
            return;
        }

        this.ref.current.setValues(
            this.props.distractingList.map(v => v.app),
            this.props.distractingList.map(v => v.title)
        );
    }

    onSubmit = (ans: any) => {
        this.props.setDistractingList(ans);
    };

    onSave = () => {
        if (this.ref.current) {
            this.ref.current.handleSubmit();
        }
    };

    render() {
        const node = (
            // @ts-ignore
            <WrappedDynamicFieldSet wrappedComponentRef={this.ref} onSubmit={this.onSubmit} />
        );
        return <Container>{node}</Container>;
    }
}

export const DistractingList = connect(
    (state: RootState, props: InputProps) => {
        if (props.boardId == null) {
            return {
                distractingList: state.timer.distractingList
            };
        }

        return {
            distractingList: state.kanban.boards[props.boardId].distractionList || []
        };
    },
    (dispatch: Dispatch, props: InputProps) => {
        if (props.boardId == null) {
            return {
                setDistractingList: (rows: DistractingRow[]) =>
                    actions.setDistractingList(rows)(dispatch)
            };
        }

        return {
            setDistractingList: (rows?: DistractingRow[]) =>
                boardActions.setDistractionList(props.boardId!, rows)(dispatch)
        };
    },
    null,
    { forwardRef: true }
)(PrivateDistractingList);

export const DistractingListModalButton = (props: InputProps) => {
    const [editingDistracting, setEditingDistracting] = React.useState(false);
    // @ts-ignore
    const formRef = React.useRef<DistractingList>();
    const onOk = () => {
        if (formRef.current) {
            formRef.current.onSave();
        }

        setEditingDistracting(false);
    };

    return (
        <>
            {/* tslint:disable-next-line:jsx-no-lambda */}
            <Button onClick={() => setEditingDistracting(true)}>Distracting App Setting</Button>
            <Modal
                title={'Distracting App Setting'}
                visible={editingDistracting}
                /* tslint:disable-next-line:jsx-no-lambda */
                onCancel={() => setEditingDistracting(false)}
                onOk={onOk}
                destroyOnClose={true}
                okText={'Save'}
            >
                <DistractingList ref={formRef} {...props} />
            </Modal>
        </>
    );
};
