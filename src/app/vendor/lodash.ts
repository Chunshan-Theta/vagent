import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';
import uniq from 'lodash/uniq';
import uniqBy from 'lodash/uniqBy';
import keyBy from 'lodash/keyBy';
import groupBy from 'lodash/groupBy';
import mapValues from 'lodash/mapValues';
import pick from 'lodash/pick';
import omit from 'lodash/omit';
import trim from 'lodash/trim';

// import 部分的 lodash 函数並匯出

export const lodash = { 
  debounce,
  throttle,
  cloneDeep,
  merge,
  uniq,
  uniqBy,
  keyBy,
  groupBy,
  mapValues,
  pick,
  omit,
  trim
};

export default lodash;