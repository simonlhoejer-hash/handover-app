export function isWorking(status:string){

return (
status === "A" ||
status === "+DS" ||
status === "-DS"
)

}