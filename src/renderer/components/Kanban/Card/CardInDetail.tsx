import React, { FC, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { Card, CardActionTypes, actions } from './action';
import { actions as kanbanActions } from '../action';
import { RootState } from '../../../reducers';
import { genMapDispatchToProp } from '../../../utils';
import { Form, Input, Modal, TimePicker } from 'antd';
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
    estimatedTime?: moment.Moment;
}

const _CardInDetail: FC<Props> = (props: Props) => {
    const { card, visible, form, onCancel, listId } = props;
    const isCreating = !card;
    const { getFieldDecorator, setFieldsValue, validateFields, resetFields } = form;
    if (!visible) {
        return <span style={{ display: 'none' }} />;
    }

    const saveValues = ({ title, content, estimatedTime }: FormData) => {
        if (!card) {
            // Creating
            const _id = shortid.generate();
            props.addCard(_id, listId, title, content);
            props.setEstimatedTime(_id, estimatedTime ? estimatedTime.hours() : 0);
        } else {
            // Edit
            props.renameCard(card._id, title);
            props.setContent(card._id, content);
            props.setEstimatedTime(card._id, estimatedTime ? estimatedTime.hours() : 0);
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
            setFieldsValue({
                title: card.title,
                content: card.content,
                estimatedTime: time ? moment(time.toString(), 'HH') : undefined
            } as FormData);
        } else {
            setFieldsValue({
                title: '',
                content: '',
                estimatedTime: undefined
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
                    })(<Input />)}
                </Form.Item>
                <Form.Item label="Content">
                    {getFieldDecorator('content')(
                        <TextArea autosize={{ minRows: 3, maxRows: 5 }} />
                    )}
                </Form.Item>
                <Form.Item label="Estimated Time">
                    {getFieldDecorator('estimatedTime')(<TimePicker format={'HH'} />)}
                </Form.Item>
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
