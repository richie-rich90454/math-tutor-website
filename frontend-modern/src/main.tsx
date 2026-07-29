import { render } from 'preact';
import { App } from './App';
import 'katex/dist/katex.min.css';
import './styles/main.css';

const root = document.getElementById('app');
if (root) {
    render(<App />, root);
}
