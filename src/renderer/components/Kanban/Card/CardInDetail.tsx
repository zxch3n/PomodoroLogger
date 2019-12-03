import React, { FC, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { actions, Card, CardActionTypes } from './action';
import { actions as kanbanActions } from '../action';
import { RootState } from '../../../reducers';
import ReactHotkeys from 'react-hot-keys';
import { genMapDispatchToProp } from '../../../utils';
import {
    Button,
    Col,
    Form,
    Icon,
    Input,
    InputNumber,
    Menu,
    Modal,
    Popconfirm,
    Row,
    Switch
} from 'antd';
import TextArea from 'antd/es/input/TextArea';
import shortid from 'shortid';
import styled from 'styled-components';

const Container = styled.div`
    .ant-form-item {
        margin-bottom: 8px;
    }
`;

interface Props extends CardActionTypes {
    visible: boolean;
    onCancel: () => void;
    card?: Card;
    form: any;
    listId: string;
}

interface FormData {
    title: string;
    content: string;
    estimatedTime?: number;
    actualTime?: number;
}

const _CardInDetail: FC<Props> = (props: Props) => {
    const { card, visible, form, onCancel, listId } = props;
    const isCreating = !card;
    const { getFieldDecorator, setFieldsValue, validateFields, resetFields } = form;
    useEffect(() => {
        if (card) {
            const time = card.spentTimeInHour.estimated;
            const actual = card.spentTimeInHour.actual;
            setFieldsValue({
                title: card.title,
                content: card.content,
                estimatedTime: time ? time : undefined,
                actualTime: actual ? actual : undefined
            } as FormData);
        } else {
            setFieldsValue({
                title: '',
                content: '',
                estimatedTime: undefined,
                actualTime: undefined
            } as FormData);
        }
    }, [card]);
    const onDelete = () => {
        if (!card) {
            return;
        }

        props.deleteCard(card._id, listId);
        onCancel();
    };

    const [isEditingActualTime, setIsEditingActualTime] = useState(false);
    const onSwitchIsEditing = () => {
        setIsEditingActualTime(!isEditingActualTime);
    };

    if (!visible) {
        return <span style={{ display: 'none' }} />;
    }

    const saveValues = ({ title, content, estimatedTime, actualTime }: FormData) => {
        const time = estimatedTime || 0;
        if (!card) {
            // Creating
            const _id = shortid.generate();
            props.addCard(_id, listId, title, content);
            props.setEstimatedTime(_id, time);
        } else {
            // Edit
            props.renameCard(card._id, title);
            props.setContent(card._id, content);
            props.setEstimatedTime(card._id, time);
            if (actualTime !== undefined) {
                props.setActualTime(card._id, actualTime);
            }
        }
    };

    const onSave = () => {
        validateFields((err: Error, values: FormData) => {
            if (err) {
                throw err;
            }

            saveValues(values);
            resetFields();
            onCancel();
        });
    };

    return (
        <Modal
            visible={visible}
            title={isCreating ? 'Create a new card' : 'Edit'}
            okText={isCreating ? 'Create' : 'Save'}
            onCancel={onCancel}
            onOk={onSave}
        >
            <ReactHotkeys keyName={'ctrl+enter'} onKeyDown={onSave} />
            <Container>
                <Form layout="vertical">
                    <Form.Item label="Title">
                        {getFieldDecorator('title', {
                            rules: [{ required: true, message: 'Please input the name of board!' }]
                        })(<Input placeholder={'Title'} />)}
                    </Form.Item>
                    <Form.Item label="Content">
                        {getFieldDecorator('content')(
                            <TextArea
                                autosize={{ minRows: 3, maxRows: 5 }}
                                placeholder={'Description'}
                            />
                        )}
                    </Form.Item>
                    <Row>
                        <Col span={12}>
                            <Form.Item label="Estimated Time In Hour">
                                {getFieldDecorator('estimatedTime')(
                                    <InputNumber
                                        min={0}
                                        max={100}
                                        step={0.5}
                                        precision={1}
                                        placeholder={'Estimated Time In Hour'}
                                    />
                                )}
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            {isCreating ? (
                                undefined
                            ) : (
                                <Form.Item label="Actual Spent Time In Hour">
                                    {getFieldDecorator('actualTime')(
                                        <InputNumber
                                            disabled={!isEditingActualTime}
                                            precision={2}
                                            min={0}
                                            step={0.2}
                                            placeholder={'Actual Time In Hour'}
                                        />
                                    )}
                                    <Button
                                        style={{ marginLeft: 4 }}
                                        icon={isEditingActualTime ? 'unlock' : 'lock'}
                                        shape={'circle-outline'}
                                        onClick={onSwitchIsEditing}
                                    />
                                </Form.Item>
                            )}
                        </Col>
                    </Row>
                    {isCreating ? (
                        undefined
                    ) : (
                        <Row>
                            <Popconfirm title={'Are you sure?'} onConfirm={onDelete}>
                                <Button type={'danger'} icon={'delete'}>
                                    Delete
                                </Button>
                            </Popconfirm>
                        </Row>
                    )}
                </Form>
            </Container>
        </Modal>
    );
};

export const CardInDetail = connect(
    (state: RootState) => {
        const { isEditing, _id, listId } = state.kanban.kanban.editCard;
        return {
            listId,
            card: _id === undefined ? undefined : state.kanban.cards[_id],
            visible: isEditing
        };
    },
    genMapDispatchToProp<CardActionTypes>({
        ...actions,
        onCancel: () => (dispatch: any) => dispatch(kanbanActions.setEditCard(false, '', undefined))
    })
)(Form.create({})(_CardInDetail));
