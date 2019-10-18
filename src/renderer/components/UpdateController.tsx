import { ipcRenderer } from 'electron';
import * as React from 'react';
import { Modal, notification } from 'antd';

interface State {
    type: 'hidden' | 'update-available' | 'progress' | 'downloaded';
    progress: number;
    versionInfo: string;
}

export class UpdateController extends React.Component<any, State> {
    constructor(props: any) {
        super(props);
        this.state = {
            type: 'hidden',
            progress: 0,
            versionInfo: ''
        };
    }

    componentDidMount() {
        ipcRenderer.addListener('update-available', (event: any, message: string) => {
            this.setState({
                versionInfo: message,
                type: 'update-available'
            });
        });

        ipcRenderer.addListener('update-downloaded', () => {
            this.notifyDownloaded();
        });
    }

    onOk = () => {
        ipcRenderer.send('download-update', '111');
        this.setState({ type: 'hidden' });
    };

    onCancel = () => {
        this.setState({ type: 'hidden' });
    };

    notifyDownloaded = () => {
        const args = {
            message: 'Update Downloaded',
            description: 'When you are ready, quit the app to start installation',
            duration: 0
        };
        notification.open(args);
    };

    render() {
        return (
            <Modal
                title={'Update Available'}
                visible={this.state.type === 'update-available'}
                onOk={this.onOk}
                onCancel={this.onCancel}
            >
                <p>A new version is available: </p>
                <p>{this.state.versionInfo}</p>
                <p>Start downloading now?</p>
            </Modal>
        );
    }
}
