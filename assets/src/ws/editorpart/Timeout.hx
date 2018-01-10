package ws.editorpart;

class Timeout
{
    static var period: Float = 30000;
    var last_date_now: Float = 0;

    public function new() {}

    public function start(): Void
    {
        this.last_date_now = Date.now().getTime();
    }

    public function clear(): Void
    {
        this.last_date_now = 0;
    }

    public function hasExpired(): Bool
    {
        return Date.now().getTime() > (last_date_now + period);
    }
}
