import { render } from 'preact';
import { App } from './App';
import 'katex/dist/katex.min.css';
import './styles/main.css';

render(<App />, document.getElementById('app'));
