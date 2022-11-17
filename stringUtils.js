const lettersInCommon = (a, b) => {
    const size = a.length;
    for (let i = 0; i < size; i++) {
        if (a.charCodeAt(i) !== b.charCodeAt(i))
            return i;
    }

}

module.exports.lettersInCommon = lettersInCommon;
