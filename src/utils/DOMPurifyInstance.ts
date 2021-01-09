import jsdom from 'jsdom';
import createDOMPurify from 'dompurify';

const { JSDOM } = jsdom;
const { window } = new JSDOM('');
const DOMPurify = createDOMPurify(<Window>(<unknown>window));

export default DOMPurify;
