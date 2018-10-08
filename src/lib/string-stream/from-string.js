import {StringStream} from ".";


/**
 * Creates a StringStream and writes a specific string.
 *
 * @param  {String} str      the string to push the your stream
 * @param  {String} encoding optional encoding
 * @return {StringStream}          new StringStream.
 */
StringStream.prototype.fromString =  function fromString(str, encoding) {
    const st =  new this(encoding || "utf-8");
    st.end(str);
    return st;
};
