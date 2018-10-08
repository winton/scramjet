import {MultiStream} from "./";


MultiStream.prototype.each =  function each(aFunc, rFunc) {
    return Promise.all(
        this.streams.map(
            (s) => {
                return Promise.resolve(s)
                    .then(aFunc)
                ;
            }
        )
    ).then(
        () => {
            this.on(
                "add",
                (stream) => Promise.resolve(stream).then(aFunc)
            );

            if (rFunc)
                this.on(
                    "remove",
                    (stream) => Promise.resolve(stream).then(rFunc)
                );

            return this;
        }
    );
};
