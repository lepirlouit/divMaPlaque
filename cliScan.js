const genericTable = require('./genericDaoTable');
const divService = require('./divService');
const plaqueService = require('./plaqueService');
const genericDaoTable = require('./genericDaoTable');
const stringUtils = require('./stringUtils');

const UNKNOWN_IN_SYSTEM = "La Plaque d'immatriculation est inconnu dans notre base de données. Vérifiez et recommencez l'encodage."

const findLastDelivered = async (range, skip) => {
    const { start, stop, lastEmit = start, emitStatus = "ongoing" } = range;
    let previous = lastEmit;
    let next = previous;
    let nextDivStatus = await divService.getStatus(previous);
    while (nextDivStatus !== UNKNOWN_IN_SYSTEM) {
        console.log(previous);
        previous = next;
        next = plaqueService.getNextPlaque(previous, skip);
        nextDivStatus = await divService.getStatus(next);
    }
    if (previous !== range.lastEmit) {
        range.lastEmit = previous;
        await genericDaoTable.putSerie(range);
    }
}

(async () => {
    const series = await genericTable.getSeries();
    for (const serie of series) {
        console.log(serie);
        if (serie.emitStatus === "CLOSED")
            continue;
        const inCommon = stringUtils.lettersInCommon(serie.start, serie.end);
        const toSkip = serie.start.length - inCommon - 1;
        for (let i = toSkip; i >= 0; i--) {
            console.log(i);
            await findLastDelivered(serie, i);
        }
    }

    const seriesFinished = await genericTable.getSeries();
    console.table(seriesFinished.map(a => ({ start: a.start, end: a.end, cat: a.categorie, last: a.lastEmit, lastUpdate: a.updateTime })));

})();







