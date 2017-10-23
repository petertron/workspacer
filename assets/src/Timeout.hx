class Timeout
{
    static var period: Float = 30000;
    var last_date_now: Float = 0;

    public function new() {}

    public function start()
    {
        this.last_date_now = Date.now().getTime();
    }

    public function clear()
    {
        this.last_date_now = 0;
    }

    public function hasExpired()
    {
        return Date.now().getTime() > (this.last_date_now + Timeout.period);
    }
}
