import React, { FC, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { Card, CardActionTypes, actions } from './action';
import { actions as kanbanActions } from '../action';
import { RootState } from '../../../reducers';
import { genMapDispatchToProp } from '../../../utils';
import { Form, Input, Modal } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import shortid from 'shortid';

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
}

const _CardInDetail: FC<Props> = (props: Props) => {
    const { card, visible, form, onCancel, listId } = props;
    const isCreating = !card;
    const { getFieldDecorator, setFieldsValue, validateFields, resetFields } = form;
    if (!visible) {
        return <span style={{ display: 'none' }} />;
    }

    const saveValues = ({ title, content }: FormData) => {
        if (!card) {
            // Creating
            props.addCard(shortid.generate(), listId, title, content);
        } else {
            // Edit
            props.renameCard(card._id, title);
            props.setContent(card._id, content);
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
            setFieldsValue({
                title: card.title,
                content: card.content
            });
        } else {
            setFieldsValue({
                title: '',
                content: ''
            });
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
