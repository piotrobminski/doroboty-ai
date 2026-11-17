import { longContentJob } from './fixtures.mjs';
import { offerMarkup } from '../job-view.mjs';

document.querySelector('#long-offer').innerHTML = offerMarkup(longContentJob, { preview: true });
