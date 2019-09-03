import React, { FC, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { Card, CardActionTypes, actions } from './action';
import { actions as kanbanActions } from '../action';
import { RootState } from '../../../reducers';
import { formatTime, genMapDispatchToProp, parseTime } from '../../../utils';
import { Form, Input, Modal, TimePicker, InputNumber } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import shortid from 'shortid';
import moment from 'moment';

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

    return (
        <Modal
            visible={visible}
            title={isCreating ? 'Create a new card' : 'Edit'}
            okText={isCreating ? 'Create' : 'Save'}
            onCancel={onCancel}
            onOk={onSave}
        >
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
                {isCreating ? (
                    undefined
                ) : (
                    <Form.Item label="Actual Spent Time In Hour">
                        {getFieldDecorator('actualTime')(
                            <InputNumber
                                disabled={true}
                                precision={2}
                                min={0}
                                step={0.2}
                                placeholder={'Actual Time In Hour'}
                            />
                        )}
                    </Form.Item>
                )}
            </Form>
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
