exports.generateTime = () => {
    const now = new Date();

    const hours = (now.getHours() < 10 ? '0' : '') + now.getHours();
    const minutes = (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
    const seconds = (now.getSeconds() < 10 ? '0' : '') + now.getSeconds();

    return hours + ':' + minutes + ':' + seconds;
}
exports.generateDate = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");

    return year + '-' + month + '-' + day;
}