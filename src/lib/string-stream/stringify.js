import {StringStream} from ".";


/**
 * @meta.noReadme
 * @ignore
 */
StringStream.prototype.toStringStream = function toStringStream(encoding) {
    if (encoding)
        return this.tap().pipe(this._selfInstance(encoding, {
            referrer: this
        }));
    else
        return this;
};
